import { FirebaseError } from "firebase/app";
import {
  type DocumentReference,
  type DocumentSnapshot,
  getDocFromServer,
  runTransaction,
  type Transaction,
} from "firebase/firestore";

const MAX_COMPLETION_ATTEMPTS = 3;

export async function runTradeCompletionTransaction(
  reference: DocumentReference,
  action: (
    transaction: Transaction,
    snapshot: DocumentSnapshot,
  ) => Promise<void>,
) {
  for (let attempt = 0; attempt < MAX_COMPLETION_ATTEMPTS; attempt += 1) {
    let previousVersion: string | undefined;
    try {
      await runTransaction(reference.firestore, async (transaction) => {
        const snapshot = await transaction.get(reference);
        previousVersion = JSON.stringify(snapshot.data() ?? null);
        await action(transaction, snapshot);
      });
      return;
    } catch (error) {
      if (
        !(error instanceof FirebaseError) ||
        error.code !== "permission-denied" ||
        previousVersion === undefined ||
        attempt === MAX_COMPLETION_ATTEMPTS - 1
      )
        throw error;
      // 동시 제출로 규칙의 이전 상태가 바뀌면 SDK가 충돌 대신 권한 오류를 반환할 수 있습니다.
      // 실제 완료 문서가 변경된 경우에만 새 상태로 재시도합니다.
      const latest = await getDocFromServer(reference);
      if (JSON.stringify(latest.data() ?? null) === previousVersion)
        throw error;
    }
  }
}
