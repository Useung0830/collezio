import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

import { PRODUCT_CATEGORIES } from "../functions/src/productRegistrationData.js";
import { getProductTitleTerms } from "../functions/src/productSearchTerms.js";

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const projectOption = args.indexOf("--project");
const projectId = projectOption >= 0 ? args[projectOption + 1] : null;
const categoryMapOption = args.indexOf("--category-map");
const categoryMapPath =
  categoryMapOption >= 0 ? args[categoryMapOption + 1] : null;
const isApply = args.includes("--apply");
if (
  !projectId ||
  !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId) ||
  (categoryMapOption >= 0 && !categoryMapPath) ||
  args.some((arg, index) =>
    index === projectOption + 1 || index === categoryMapOption + 1
      ? false
      : !["--project", "--category-map", "--apply", "--dry-run"].includes(arg),
  ) ||
  (isApply && args.includes("--dry-run"))
) {
  throw new Error(
    "Usage: node scripts/backfillProductSearch.mjs --project PROJECT_ID [--category-map FILE] [--dry-run | --apply]",
  );
}
const categoryMap = categoryMapPath
  ? JSON.parse(await readFile(categoryMapPath, "utf8"))
  : {};
if (
  !categoryMap ||
  Array.isArray(categoryMap) ||
  Object.values(categoryMap).some(
    (category) => !PRODUCT_CATEGORIES.includes(category),
  )
)
  throw new Error("Category map must map product IDs to valid categories.");
if (
  Object.keys(process.env).some(
    (key) => key.endsWith("EMULATOR_HOST") && process.env[key],
  )
)
  throw new Error("Unset emulator environment variables before running.");

const cliAuth = require("firebase-tools/lib/auth");
const account = cliAuth.getGlobalDefaultAccount();
if (!account) throw new Error("Run firebase login first.");

let accessToken;
let tokenExpiresAt = 0;
async function request(url, options = {}) {
  if (Date.now() >= tokenExpiresAt) {
    const credentials = await cliAuth.getAccessToken(
      account.tokens.refresh_token,
      ["https://www.googleapis.com/auth/cloud-platform"],
    );
    accessToken = credentials.access_token;
    tokenExpiresAt = Date.now() + 30 * 60 * 1000;
  }
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(`Firestore HTTP ${response.status}`);
  return response.json();
}

const collectionUrl =
  `https://firestore.googleapis.com/v1/projects/${projectId}` +
  "/databases/(default)/documents/products";
let pageToken = "";
let scanned = 0;
let pending = 0;
let updated = 0;
let missingCategory = 0;
let missingTitle = 0;
const missingCategoryProducts = [];
const unmappedProducts = [];
const updates = [];
const categoryCounts = Object.fromEntries(
  PRODUCT_CATEGORIES.map((category) => [category, 0]),
);

do {
  const listUrl = new URL(collectionUrl);
  listUrl.searchParams.set("pageSize", "100");
  if (pageToken) listUrl.searchParams.set("pageToken", pageToken);
  const page = await request(listUrl);
  for (const document of page.documents ?? []) {
    scanned++;
    const title = document.fields?.title?.stringValue;
    if (!title) {
      missingTitle++;
      continue;
    }
    const existingCategory = document.fields?.category?.stringValue;
    const hasCategory = PRODUCT_CATEGORIES.includes(existingCategory);
    if (hasCategory) categoryCounts[existingCategory]++;
    else {
      missingCategory++;
      const product = { id: document.name.split("/").at(-1), title };
      missingCategoryProducts.push(product);
      if (!categoryMap[product.id]) unmappedProducts.push(product);
    }
    const category = hasCategory
      ? existingCategory
      : categoryMap[document.name.split("/").at(-1)];
    const terms = getProductTitleTerms(title);
    const existingTerms = document.fields?.titleTerms?.arrayValue?.values?.map(
      (value) => value.stringValue,
    );
    if (
      existingCategory === category &&
      JSON.stringify(existingTerms) === JSON.stringify(terms)
    )
      continue;
    pending++;
    updates.push({ document, category, terms });
  }
  pageToken = page.nextPageToken ?? "";
} while (pageToken);

if (isApply && unmappedProducts.length)
  throw new Error(
    `${unmappedProducts.length} products have no category map entry. Run --dry-run and review missingCategoryProducts first.`,
  );

if (isApply)
  for (const { document, category, terms } of updates) {
    const updateUrl = new URL(
      `https://firestore.googleapis.com/v1/${document.name}`,
    );
    updateUrl.searchParams.append("updateMask.fieldPaths", "category");
    updateUrl.searchParams.append("updateMask.fieldPaths", "titleTerms");
    updateUrl.searchParams.set(
      "currentDocument.updateTime",
      document.updateTime,
    );
    await request(updateUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          category: { stringValue: category },
          titleTerms: {
            arrayValue: {
              values: terms.map((term) => ({ stringValue: term })),
            },
          },
        },
      }),
    });
    updated++;
  }

process.stdout.write(
  JSON.stringify({
    projectId,
    mode: isApply ? "apply" : "dry-run",
    scanned,
    pending,
    updated,
    missingCategory,
    missingTitle,
    categoryCounts,
    missingCategoryProducts,
    unmappedProducts,
  }) + "\n",
);
