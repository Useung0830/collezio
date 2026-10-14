// 테스트 실행에서 직접 띄운 demo 에뮬레이터만 초기화합니다.
if (
  process.env.GCLOUD_PROJECT !== "demo-collezio" ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8080" ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9099"
)
  throw new Error("demo-collezio 로컬 에뮬레이터에서만 초기화할 수 있습니다.");

for (const url of [
  "http://127.0.0.1:8080/emulator/v1/projects/demo-collezio/databases/(default)/documents",
  "http://127.0.0.1:9099/emulator/v1/projects/demo-collezio/accounts",
]) {
  const response = await fetch(url, { method: "DELETE" });
  if (!response.ok)
    throw new Error(`에뮬레이터 초기화 실패: ${response.status}`);
}
