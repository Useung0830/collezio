import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import { compressProductImage } from "../functions/src/compressProductImage.js";

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const projectId = "collezio-e3a8d";
const bucketName = "collezio-e3a8d.firebasestorage.app";
if (args.some((arg) => !["--apply", "--dry-run"].includes(arg)))
  throw new Error(
    "Use --dry-run or --apply (copies only; never changes products).",
  );
if (
  Object.keys(process.env).some(
    (key) => key.endsWith("EMULATOR_HOST") && process.env[key],
  )
)
  throw new Error("Unset emulator environment variables before running.");
const cliAuth = require("firebase-tools/lib/auth");
const account = cliAuth.getGlobalDefaultAccount();
if (!account) throw new Error("Run firebase login first.");
const runId =
  new Date().toISOString().replace(/[:.]/g, "-") +
  "-" +
  randomUUID().slice(0, 8);
const output = path.resolve(".local-review/image-migration", runId);
await mkdir(output, { recursive: true });
const rows = [];
let token;
let tokenExpires = 0;
async function request(url, options = {}) {
  if (Date.now() >= tokenExpires) {
    const credentials = await cliAuth.getAccessToken(
      account.tokens.refresh_token,
      [
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/firebase",
      ],
    );
    token = credentials.access_token;
    tokenExpires = Date.now() + 30 * 60 * 1000;
  }
  const response = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: "Bearer " + token },
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    const error = new Error("HTTP " + response.status);
    error.status = response.status;
    throw error;
  }
  return response;
}
const documentsUrl =
  "https://firestore.googleapis.com/v1/projects/" +
  projectId +
  "/databases/(default)/documents";
const objectUrl = (name) =>
  "https://storage.googleapis.com/storage/v1/b/" +
  bucketName +
  "/o/" +
  encodeURIComponent(name);
const hash = (buffer) => createHash("sha256").update(buffer).digest("hex");
async function saveReport() {
  const successful = rows.filter((row) =>
    ["saved", "reused", "dry-run"].includes(row.status),
  );
  const originalBytes = successful.reduce(
    (sum, row) => sum + row.originalBytes,
    0,
  );
  const bytes = successful.reduce((sum, row) => sum + row.bytes, 0);
  const summary = {
    projectId,
    bucketName,
    runId,
    mode: apply ? "copies-only" : "dry-run",
    images: rows.length,
    counts: rows.reduce(
      (counts, row) => ({
        ...counts,
        [row.status]: (counts[row.status] ?? 0) + 1,
      }),
      {},
    ),
    originalBytes,
    bytes,
    savedBytes: originalBytes - bytes,
    savedPercent: originalBytes
      ? ((originalBytes - bytes) / originalBytes) * 100
      : 0,
    productReferencesChanged: false,
  };
  await writeFile(
    path.join(output, "report.json"),
    JSON.stringify({ summary, images: rows }, null, 2) + "\n",
  );
  const columns = [
    "productId",
    "imageIndex",
    "sourcePath",
    "sourceGeneration",
    "targetPath",
    "status",
    "reason",
    "originalBytes",
    "bytes",
    "savedBytes",
    "savedPercent",
    "sourceWidth",
    "sourceHeight",
    "width",
    "height",
    "sourceContentType",
    "contentType",
    "sourceSha256",
    "outputSha256",
  ];
  const csv = (value) => '"' + String(value ?? "").replaceAll('"', '""') + '"';
  await writeFile(
    path.join(output, "report.csv"),
    "\uFEFF" +
      [
        columns.join(","),
        ...rows.map((row) => columns.map((key) => csv(row[key])).join(",")),
      ].join("\r\n"),
  );
  return summary;
}
async function migrateImage(row, sellerId) {
  if (
    typeof row.sourcePath !== "string" ||
    !row.sourcePath.startsWith("products/" + sellerId + "/") ||
    row.sourcePath.split("/").length !== 3
  )
    throw new Error("Unexpected product image path");
  const metadata = await (await request(objectUrl(row.sourcePath))).json();
  row.sourceGeneration = metadata.generation;
  row.originalBytes = Number(metadata.size);
  row.sourceContentType = metadata.contentType;
  if (metadata.metadata?.compressionVersion === "1") {
    row.status = "already-optimized";
    return;
  }
  if (row.originalBytes > 5 * 1024 * 1024) {
    row.status = "skipped";
    row.reason = "Over current 5MiB input limit";
    return;
  }
  const buffer = Buffer.from(
    await (
      await request(
        objectUrl(row.sourcePath) +
          "?alt=media&generation=" +
          metadata.generation,
      )
    ).arrayBuffer(),
  );
  row.sourceSha256 = hash(buffer);
  const sharp = createRequire(
    new URL("../functions/package.json", import.meta.url),
  )("sharp");
  const dimensions = await sharp(buffer).metadata();
  row.sourceWidth = dimensions.width;
  row.sourceHeight = dimensions.height;
  const image = await compressProductImage({
    buffer,
    contentType: metadata.contentType,
  });
  Object.assign(row, {
    bytes: image.bytes,
    savedBytes: image.originalBytes - image.bytes,
    savedPercent:
      ((image.originalBytes - image.bytes) / image.originalBytes) * 100,
    width: image.width,
    height: image.height,
    contentType: image.contentType,
    outputSha256: hash(image.buffer),
  });
  if (!image.isCompressed) {
    row.status = "skipped";
    row.reason = "No size reduction";
    return;
  }
  row.targetPath =
    "products/" +
    sellerId +
    "/migration-v1-" +
    hash(row.sourcePath + ":" + metadata.generation);
  if (!apply) {
    row.status = "dry-run";
    return;
  }
  const current = await (
    await request(documentsUrl + "/products/" + row.productId)
  ).json();
  const paths = current.fields?.images?.arrayValue?.values ?? [];
  if (
    current.fields?.sellerId?.stringValue !== sellerId ||
    !paths.some(
      (entry) => entry.mapValue?.fields?.path?.stringValue === row.sourcePath,
    )
  )
    throw new Error("Product image changed during migration");
  const currentMetadata = await (
    await request(objectUrl(row.sourcePath))
  ).json();
  if (currentMetadata.generation !== metadata.generation)
    throw new Error("Source generation changed");
  const targetMetadata = {
    name: row.targetPath,
    contentType: image.contentType,
    cacheControl: "public,max-age=31536000,immutable",
    metadata: {
      compressionVersion: "1",
      migrationRunId: runId,
      sourcePath: row.sourcePath,
      sourceGeneration: metadata.generation,
      sourceSha256: row.sourceSha256,
      outputSha256: row.outputSha256,
      originalBytes: String(image.originalBytes),
      bytes: String(image.bytes),
      width: String(image.width),
      height: String(image.height),
    },
  };
  const boundary = "migration-" + randomUUID();
  const body = Buffer.concat([
    Buffer.from(
      "--" +
        boundary +
        "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(targetMetadata) +
        "\r\n--" +
        boundary +
        "\r\nContent-Type: " +
        image.contentType +
        "\r\n\r\n",
    ),
    image.buffer,
    Buffer.from("\r\n--" + boundary + "--\r\n"),
  ]);
  try {
    await request(
      "https://storage.googleapis.com/upload/storage/v1/b/" +
        bucketName +
        "/o?uploadType=multipart&ifGenerationMatch=0",
      {
        method: "POST",
        headers: { "Content-Type": "multipart/related; boundary=" + boundary },
        body,
      },
    );
    row.status = "saved";
  } catch (error) {
    if (error.status !== 412) throw error;
    row.status = "reused";
  }
  const stored = await (await request(objectUrl(row.targetPath))).json();
  if (
    stored.metadata?.sourceSha256 !== row.sourceSha256 ||
    stored.metadata?.outputSha256 !== row.outputSha256 ||
    Number(stored.size) !== image.bytes
  )
    throw new Error("Stored copy verification failed");
  const storedBuffer = Buffer.from(
    await (
      await request(
        objectUrl(row.targetPath) +
          "?alt=media&generation=" +
          stored.generation,
      )
    ).arrayBuffer(),
  );
  if (hash(storedBuffer) !== row.outputSha256)
    throw new Error("Stored bytes verification failed");
}
let pageToken;
do {
  const url = new URL(documentsUrl + "/products");
  url.searchParams.set("pageSize", "100");
  if (pageToken) url.searchParams.set("pageToken", pageToken);
  const page = await (await request(url)).json();
  for (const document of page.documents ?? []) {
    const productId = document.name.split("/").at(-1);
    const sellerId = document.fields?.sellerId?.stringValue;
    const images = document.fields?.images?.arrayValue?.values ?? [];
    for (const [imageIndex, entry] of images.entries()) {
      const row = {
        productId,
        imageIndex,
        sourcePath: entry.mapValue?.fields?.path?.stringValue,
      };
      try {
        await migrateImage(row, sellerId);
      } catch (error) {
        row.status =
          error.code === "failed-precondition" ? "skipped" : "failed";
        row.reason = error.message;
      }
      rows.push(row);
      await saveReport();
      process.stdout.write(
        JSON.stringify({
          productId,
          imageIndex,
          status: row.status,
          savedBytes: row.savedBytes,
        }) + "\n",
      );
    }
  }
  pageToken = page.nextPageToken;
} while (pageToken);
process.stdout.write(
  JSON.stringify({ output, summary: await saveReport() }, null, 2) + "\n",
);
if (rows.some((row) => row.status === "failed")) process.exitCode = 1;
