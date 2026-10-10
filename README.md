This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 상세 페이지 공유 메타데이터

- 상품·게시글 상세는 공개 Firestore 문서에서 제목·본문 요약·대표 이미지를 조회해 Open Graph와 Twitter 카드를 생성합니다. 본문 화면의 데이터 조회는 기존 클라이언트 방식을 유지합니다.
- `SITE_URL`은 canonical과 공유 URL의 기준 origin입니다. 미설정 시 `https://collezio.vercel.app`을 사용하며, 운영 도메인이 바뀌면 배포 환경변수도 변경해야 합니다. 경로·쿼리·인증 정보가 없는 HTTPS 주소를 사용하고 로컬 테스트만 HTTP를 허용합니다.
- 공유 이미지는 현재 Storage 버킷과 상품 판매자 또는 게시글 작성자·문서 경로가 일치하는 첫 유효 이미지입니다. 원본 다운로드 URL을 사용하며, 형식이 잘못되었거나 사진이 없으면 기존 서비스 배너인 `/share-default.jpg`를 사용합니다. 메타데이터 요청마다 이미지 파일의 존재 여부를 별도로 조회하지는 않습니다.
- 문서 미존재·권한 거부는 기본 공유 문구·이미지와 `noindex`로 처리하고, 일시적 조회 장애는 기본 공유 정보로 처리합니다. Firebase 규칙 변경 없이 공개 REST 조회를 사용하며, 실제 공유 앱의 미리보기와 캐시 갱신은 사이트 배포 후 별도로 확인합니다.

```bash
npm run check
npm run test:unit
npm run build
npx firebase emulators:exec --config firebase.e2e.json --project demo-collezio --only auth,firestore,storage "npx playwright test tests/e2e/detail-metadata.spec.ts"
```

## 커뮤니티

구현 범위, 데이터 처리, 실패 복구와 로컬 검증 방법은 [커뮤니티 구현 현황](docs/community.md)을 참고하세요.

## 채팅 신고와 차단

- 신고는 `users/{신고자ID}/chatReports/{신고ID}`에 저장합니다. 채팅 상대만 신고할 수 있으며, 신고자만 개별 접수 내용을 조회할 수 있습니다. 상대방은 신고 내용을 읽을 수 없습니다.
- 신고 사유와 최대 1,000자의 상세 내용을 받으며, 기타 사유는 상세 내용이 필수입니다. 실패 후 같은 요청 ID로 재시도해 중복 저장을 방지합니다. 신고 접수는 자동 차단이나 관리자 제재를 수행하지 않습니다.
- 차단은 `users/{사용자ID}/chatBlocks/{상대ID}`에 저장하며, 해당 사용자와의 모든 채팅방에 적용합니다. 기존 메시지와 목록은 유지하고 양쪽의 새 메시지 전송 및 새 채팅방 생성을 제한합니다.
- 차단 목록은 본인만 조회할 수 있습니다. 상대방은 자신과의 차단 문서만 조회할 수 있으며 화면에는 일반적인 전송 불가 안내를 표시합니다. 상호 차단은 양쪽 모두 해제해야 전송을 재개할 수 있습니다.
- 관리자 신고 처리 화면은 후속 작업입니다. 운영 반영 시 애플리케이션과 함께 `firestore.rules`를 대상 Firebase 프로젝트에 배포해야 합니다. 로컬 테스트는 운영 규칙을 배포하지 않습니다.

## 채팅 이미지 전송

- 카메라 버튼으로 JPG·PNG·WebP를 최대 10장(장당 5MB) 선택합니다. 추가 선택과 개별 삭제가 가능하며, 입력창 위에서 미리보기를 확인합니다.
- 이미지와 텍스트는 한 트랜잭션으로 확정하되 별도 메시지로 저장합니다. 이미지 ID는 전송 ID의 `-0`, 텍스트 ID는 `-1`로 끝납니다. 동일 서버 시각의 문서는 Firestore의 문서 ID 정렬을 사용하므로 이미지가 먼저 표시됩니다.
- 단일 이미지 경로는 `chat/{roomId}/{senderId}/{imageMessageId}`, 묶음은 그 아래 `/{index}`(0~9)입니다. 묶음의 `imagePaths` 배열을 하나의 메시지에 저장하며 기존 `imagePath` 메시지도 표시합니다. 다운로드 토큰 URL을 메시지에 저장하지 않고, 인증된 Storage 다운로드로 표시합니다. 채팅 참여자만 읽을 수 있고, 상대방은 메시지 확정 전의 업로드를 읽을 수 없습니다.
- 썸네일은 빈칸 없이 채우는 그리드이며, 7~10장은 세로로 긴 묶음으로 표시합니다. 묶음을 누르면 첫 사진부터 상세 창이 열립니다. 좌우 버튼·방향키·휴대폰 스와이프로 이동하고 현재 사진을 저장하거나 공유할 수 있습니다. 파일 공유를 지원하지 않는 브라우저는 저장 후 공유 안내를 표시합니다. 공유 API 연결은 자동 테스트로 검증하며 실제 공유 대상 앱과 OS 저장 위치는 기기에 따라 다릅니다.
- 업로드 허가 문서는 `chatRooms/{roomId}/imageUploads/{imageMessageId}`에 저장하며 10분 동안 유효합니다. 차단 시 새 허가와 메시지 확정을 거부합니다. 이미 발급된 허가로 진행 중인 업로드가 완료되더라도 차단 후 메시지 확정은 거부됩니다.
- 실패 시 입력과 요청 ID를 유지합니다. 재시도는 업로드된 파일의 SHA-256을 확인해 재사용하며 전송된 이미지는 덮어쓰거나 삭제하지 않습니다. 실패 후 화면을 떠나면 미확정 파일·허가 문서가 남을 수 있으며 자동 정리는 후속 작업입니다.
- 배포 시 `firebase deploy --only firestore:rules,storage --project <project-id>`를 실행해야 합니다. 인증 다운로드를 위해 Storage 버킷의 CORS에서 앱의 origin과 GET 요청을 허용해야 합니다. 에뮬레이터 검증과 실제 Firebase 배포 후 검증을 구분합니다.
- `storage.cors.json`은 로컬 3000 포트와 `https://collezio.vercel.app`의 GET을 허용합니다. 서비스 도메인이 바뀌면 새 origin을 추가한 뒤 `gcloud storage buckets update gs://<bucket-name> --cors-file=storage.cors.json`으로 적용하세요. 기존 버킷 설정이 있다면 먼저 병합해야 합니다. CORS는 Firebase 규칙 배포에 포함되지 않으며, 누락 시 업로드는 성공해도 이미지 조회는 실패할 수 있습니다. [Firebase 다운로드 및 CORS 안내](https://firebase.google.com/docs/storage/web/download-files#cors_configuration)
- 긴 텍스트는 내부 스크롤을 유지하고 스크롤바만 숨깁니다. Enter는 전송, Shift+Enter는 줄바꿈이며 한글 조합 중 Enter는 전송하지 않습니다.

검증 명령:

```bash
npm run check
npm run build
npx firebase emulators:exec --config firebase.e2e.json --project demo-collezio --only auth,firestore,storage "node --test tests/integration/chat.rules.test.mjs && npx playwright test tests/e2e/chat.spec.ts"
```

## 채팅 거래 제안

- 구매자(채팅 요청자)가 구매·교환 조건을 제안합니다. 교환은 본인이 등록한 거래 가능한 상품 한 개를 선택하며 추가금과 지급자를 지정할 수 있습니다. 직거래는 약속 시각과 장소, 택배는 발송 예정 시각과 배송비 부담자를 입력합니다.
- 제안은 `chatRooms/{roomId}/proposals/{proposalId}`에 저장하고 같은 ID의 채팅 메시지로 연결합니다. `trade/state`는 대기 중인 제안과 확정 제안을 가리킵니다. 방마다 대기 중인 제안은 하나이며, 실패 시 같은 요청 ID로 재시도해 중복 전송을 막습니다.
- 받은 사람은 수락·거절, 보낸 사람은 철회할 수 있습니다. 수락하면 상품 예약과 제안 상태를 한 트랜잭션으로 갱신합니다. 다른 방에서 예약한 상품이나 차단된 상대와의 수락은 거부합니다. 교환은 양쪽 상품을 함께 예약합니다.
- 확정 후에는 양쪽 모두 조건 변경을 제안할 수 있습니다. 교환 상품 변경은 해당 상품 소유자인 채팅 요청자만 UI에서 선택합니다. 변경 제안이 대기·거절·철회 상태일 때 기존 조건과 예약은 유지합니다. 수락하면 이전 제안을 `superseded`로 남기고, 교체된 교환 상품 예약을 해제합니다.
- 입력 중인 조건은 해당 탭의 세션 저장소에 보관합니다. 상품 등록은 새 탭에서 열고 돌아온 뒤 목록을 새로고침할 수 있습니다. 결제, 배송 추적, 거래 완료·확정 거래 취소는 별도 기능입니다.
- 앱 반영 전에 `npx firebase deploy --only firestore:rules --project <project-id>`로 규칙을 배포해야 합니다. 에뮬레이터 테스트 성공은 운영 규칙 배포를 의미하지 않습니다.
- 검증: `npm run test:unit`, 위의 채팅 통합 테스트 및 E2E 명령을 실행합니다. 구매 수락·조건 변경 거절, 교환 상품 교체, 동시 응답, 다른 채팅의 예약 충돌과 모바일 크기 모달을 검증합니다. 실제 휴대폰 검증과 모바일 뷰포트 검증은 구분합니다.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
