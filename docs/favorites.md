# 찜 기능

## 구현 단계

1. 저장 구조, Firestore 권한, 찜 조회·변경 API와 통합 테스트
2. 상품 상세 버튼, 로그인 안내, 카운트와 쿼리 캐시 연결
3. 마이페이지의 목업 목록을 본인 찜 상품 조회로 교체
4. 화면 전체 흐름과 예외 상황 검증

4단계까지 구현과 로컬 검증을 완료했다. 상품 상세에서 찜 추가·취소 및 카운트 저장이 가능하고, 마이페이지에서 본인이 찜한 상품을 확인할 수 있다.

## 찜 목록

- `getFavoriteProducts(userId)`는 본인의 찜 기록을 `createdAt` 내림차순으로 조회한다.
- 상품 ID를 최대 30개씩 묶어 현재 상품 정보를 조회하고, 찜한 순서를 유지한다.
- 삭제된 상품은 표시하지 않는다. 제목 옆 개수는 실제로 표시할 수 있는 상품 수다. 삭제된 상품의 찜 기록을 자동 삭제하지는 않는다.
- 사용자별 쿼리 키를 사용하며 비로그인 시 로그인 안내를 표시한다. 빈 목록, 로딩, 오프라인 대기, 오류와 재시도 화면을 제공한다.
- 상세에서 찜을 변경하면 기존 `favorites` 캐시 무효화가 목록에도 적용된다.
- 현재는 전체 찜 기록을 불러온다. 페이지네이션은 포함하지 않았다.

상품 묶음의 크기는 [Firestore 쿼리 제한](https://firebase.google.com/docs/firestore/query-data/queries#query_limitations)에 맞췄다.

## 상품 상세 화면

- 사용자 ID와 상품 ID를 포함한 쿼리 키로 찜 여부를 조회한다. 비로그인 상태에서는 본인 찜 기록을 조회하지 않는다.
- 찜 상태 확인 중과 저장 중에는 버튼을 비활성화한다. 비로그인 클릭 시 로그인 안내와 링크를 표시한다.
- 저장 성공 응답으로 하트 선택 상태와 상세 카운트를 갱신한다. 요청 전에는 숫자를 미리 바꾸지 않는다.
- 완료 후 상품과 찜 쿼리를 무효화해 활성 화면을 다시 조회한다. 실패했을 때도 서버 반영 여부를 다시 확인한다.
- 조회 실패 시 재조회 버튼, 저장 실패 시 오류 안내를 표시한다. 연결이 끊긴 상태에서 누른 요청은 TanStack Query가 연결 복구까지 대기하며 대기 안내를 표시한다.
- API 자체는 오프라인 저장을 하지 않는다. 사용자 계정이 바뀌면 대기 중이던 이전 계정 요청은 API의 사용자 검사에서 거부된다.

캐시 갱신은 [TanStack Query의 mutation 후 무효화 방식](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)을 사용한다.

## 저장 구조

- `products/{productId}.favoriteCount`: 상품의 전체 찜 수. 신규 상품은 0으로 생성한다.
- `users/{userId}/favorites/{productId}`: 사용자별 찜 기록. `createdAt`에 서버 시각을 저장한다.
- 상품 ID를 찜 문서 ID로 사용해 같은 사용자가 같은 상품을 중복 저장하지 않는다.
- 찜 수가 없는 기존 상품은 0으로 취급하고 첫 변경 때 필드를 저장한다. 기존 앱의 상품 등록 요청도 허용한다.
- 카운트가 잘못된 타입이거나 음수이면 오류로 처리한다. 취소로 음수가 되는 경우도 거부한다. 전체 찜 기록을 다시 세어 기존 집계값을 보정하는 작업은 포함하지 않는다.

## API

- `getProductFavorite(productId, userId)`: 로그인한 본인의 찜 여부를 서버에서 조회한다.
- `updateProductFavorite({ productId, userId, isFavorite })`: 원하는 찜 상태를 저장하고 `{ isFavorite, favoriteCount }`를 반환한다.

변경 API는 트랜잭션 안에서 상품과 찜 기록을 읽고, 기록 생성·삭제와 카운트 증감을 함께 저장한다. 같은 목표 상태를 반복 요청하면 추가 변경하지 않는다. 동시 요청으로 충돌하면 Firestore가 다시 읽고 재시도한다. 오프라인에서는 성공 처리하지 않는다.

동시 커밋이 충돌 응답 대신 권한 오류로 반환될 때는 서버 상태를 다시 확인한다. 읽었던 찜 여부나 카운트가 실제로 바뀐 경우에만 새 트랜잭션을 시도하며, 최초 시도를 포함해 최대 3회로 제한한다. 상태가 그대로인 권한 오류는 즉시 전달한다.

조회 전후와 트랜잭션 재시도 시 로그인 사용자를 확인한다. 저장 완료 직후 계정이 바뀌면 API는 오류를 반환할 수 있지만 이미 커밋된 저장을 되돌리지는 않는다. UI는 해당 계정의 데이터를 다시 조회해야 한다.

## 권한

- 본인 찜 기록만 조회·생성·삭제할 수 있다. 기록 수정은 허용하지 않는다.
- 상품 카운트는 본인 찜 기록 생성 시 +1, 삭제 시 -1만 허용한다.
- 기록과 카운트는 같은 원자적 작업에서 함께 변경해야 한다.
- 찜 변경으로 상품 제목, 판매자 등 다른 필드를 수정할 수 없다.
- 상품 공개 조회는 유지한다. 본인 상품 찜을 제한하는 정책은 추가하지 않았다.

## 검증과 배포

```sh
npm run check
npm run build
npm run test:unit
npx firebase emulators:exec --config firebase.e2e.json --project demo-collezio --only auth,firestore "npx playwright test tests/e2e/favorites.spec.ts"
npx firebase emulators:exec --config firebase.e2e.json --project demo-collezio --only auth,firestore "node --test tests/integration/*.test.mjs"
npm run test:e2e
```

2026-09-26 로컬 검증 결과:

- `npm run check`, `npm run build` 통과
- 단위 테스트 24개, 통합 테스트 12개 통과
- 전체 E2E 20개 통과. 이 중 찜 E2E는 9개이며 재시도 없이 통과했다.
- 찜 저장·취소·새로고침, 목록 왕복 이동, 저장 거부 후 복구, 오프라인 대기, 계정 전환, 삭제 상품 제외, 목록 오류 후 복구를 검증했다.
- 실제 API로 31개 찜의 분할 조회와 최신순 정렬을 검증했다.
- 상세와 목록의 모바일 390px 화면을 확인했다.

통합 테스트는 실제 API와 로컬 Auth·Firestore 에뮬레이터를 사용한다. 운영 환경 적용에는 앱과 `firestore.rules` 배포가 필요하다. 이번 작업은 로컬 구현·검증·커밋까지이며 원격 푸시와 운영 배포는 하지 않았다.

트랜잭션 및 함께 저장되는 데이터 검증은 [Firebase 공식 문서](https://firebase.google.com/docs/firestore/manage-data/transactions)를 따른다.
