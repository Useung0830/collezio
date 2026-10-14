import "server-only";

const PUBLIC_DOCUMENT_TIMEOUT_MS = 5000;

type PublicDocumentRequest = {
  collection: "products" | "communityPosts";
  documentId: string;
  fields: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseValue(value: unknown): unknown {
  if (!isRecord(value)) return undefined;
  if (typeof value.stringValue === "string") return value.stringValue;
  if (isRecord(value.arrayValue)) {
    return Array.isArray(value.arrayValue.values)
      ? value.arrayValue.values.map(parseValue)
      : [];
  }
  if (isRecord(value.mapValue) && isRecord(value.mapValue.fields)) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields).map(([key, item]) => [
        key,
        parseValue(item),
      ]),
    );
  }
  return undefined;
}

export async function getPublicFirestoreFields({
  collection,
  documentId,
  fields,
}: PublicDocumentRequest) {
  if (
    !documentId ||
    documentId.includes("/") ||
    documentId === "." ||
    documentId === ".."
  ) {
    return null;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Firebase 프로젝트 설정이 필요합니다.");

  const isEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
  if (isEmulator && projectId !== "demo-collezio") {
    throw new Error(
      "에뮬레이터에서는 demo-collezio 프로젝트만 사용할 수 있습니다.",
    );
  }

  const origin = isEmulator
    ? `http://127.0.0.1:${process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || "8080"}`
    : "https://firestore.googleapis.com";
  const url = new URL(
    `/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${collection}/${encodeURIComponent(documentId)}`,
    origin,
  );
  for (const field of fields) url.searchParams.append("mask.fieldPaths", field);

  // 인증 토큰 없이 요청하여 브라우저의 비로그인 조회와 동일한 보안 규칙을 적용합니다.
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(PUBLIC_DOCUMENT_TIMEOUT_MS),
  });
  if (response.status === 403 || response.status === 404) return null;
  if (!response.ok) throw new Error("공개 문서 정보를 불러오지 못했습니다.");

  const document: unknown = await response.json();
  if (!isRecord(document) || !isRecord(document.fields)) {
    throw new Error("공개 문서 응답을 확인할 수 없습니다.");
  }

  const documentFields = document.fields;
  return Object.fromEntries(
    fields.map((field) => [field, parseValue(documentFields[field])]),
  );
}
