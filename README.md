This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 커뮤니티

구현 범위, 데이터 처리, 실패 복구와 로컬 검증 방법은 [커뮤니티 구현 현황](docs/community.md)을 참고하세요.

## 채팅 신고와 차단

- 신고는 `users/{신고자ID}/chatReports/{신고ID}`에 저장합니다. 채팅 상대만 신고할 수 있으며, 신고자만 개별 접수 내용을 조회할 수 있습니다. 상대방은 신고 내용을 읽을 수 없습니다.
- 신고 사유와 최대 1,000자의 상세 내용을 받으며, 기타 사유는 상세 내용이 필수입니다. 실패 후 같은 요청 ID로 재시도해 중복 저장을 방지합니다. 신고 접수는 자동 차단이나 관리자 제재를 수행하지 않습니다.
- 차단은 `users/{사용자ID}/chatBlocks/{상대ID}`에 저장하며, 해당 사용자와의 모든 채팅방에 적용합니다. 기존 메시지와 목록은 유지하고 양쪽의 새 메시지 전송 및 새 채팅방 생성을 제한합니다.
- 차단 목록은 본인만 조회할 수 있습니다. 상대방은 자신과의 차단 문서만 조회할 수 있으며 화면에는 일반적인 전송 불가 안내를 표시합니다. 상호 차단은 양쪽 모두 해제해야 전송을 재개할 수 있습니다.
- 관리자 신고 처리 화면은 후속 작업입니다. 운영 반영 시 애플리케이션과 함께 `firestore.rules`를 대상 Firebase 프로젝트에 배포해야 합니다. 로컬 테스트는 운영 규칙을 배포하지 않습니다.

## 채팅 이미지 전송

- 카메라 버튼으로 JPG·PNG·WebP 1장(최대 5MB)을 선택합니다. 입력창 위에서 미리보기를 확인하고 × 버튼으로 취소할 수 있습니다.
- 이미지와 텍스트는 한 트랜잭션으로 확정하되 별도 메시지로 저장합니다. 이미지 ID는 전송 ID의 `-0`, 텍스트 ID는 `-1`로 끝납니다. 동일 서버 시각의 문서는 Firestore의 문서 ID 정렬을 사용하므로 이미지가 먼저 표시됩니다.
- 이미지 경로는 `chat/{roomId}/{senderId}/{imageMessageId}`입니다. 다운로드 토큰 URL을 메시지에 저장하지 않고, 인증된 Storage 다운로드로 표시합니다. 채팅 참여자만 읽을 수 있고, 상대방은 메시지 확정 전의 업로드를 읽을 수 없습니다.
- 업로드 허가 문서는 `chatRooms/{roomId}/imageUploads/{imageMessageId}`에 저장하며 10분 동안 유효합니다. 차단 시 새 허가와 메시지 확정을 거부합니다. 이미 발급된 허가로 진행 중인 업로드가 완료되더라도 차단 후 메시지 확정은 거부됩니다.
- 실패 시 입력과 요청 ID를 유지합니다. 재시도는 업로드된 파일의 SHA-256을 확인해 재사용하며 전송된 이미지는 덮어쓰거나 삭제하지 않습니다. 실패 후 화면을 떠나면 미확정 파일·허가 문서가 남을 수 있으며 자동 정리는 후속 작업입니다.
- 배포 시 `firebase deploy --only firestore:rules,storage --project <project-id>`를 실행해야 합니다. 인증 다운로드를 위해 Storage 버킷의 CORS에서 앱의 origin과 GET 요청을 허용해야 합니다. 에뮬레이터 검증과 실제 Firebase 배포 후 검증을 구분합니다.
- `storage.cors.json`은 로컬 3000 포트의 GET만 허용합니다. 서비스 배포 전 실제 서비스 origin을 추가한 뒤 `gcloud storage buckets update gs://<bucket-name> --cors-file=storage.cors.json`으로 적용하세요. 기존 버킷 설정이 있다면 먼저 병합해야 합니다. CORS는 Firebase 규칙 배포에 포함되지 않으며, 누락 시 업로드는 성공해도 이미지 조회는 실패할 수 있습니다. [Firebase 다운로드 및 CORS 안내](https://firebase.google.com/docs/storage/web/download-files#cors_configuration)
- 긴 텍스트는 내부 스크롤을 유지하고 스크롤바만 숨깁니다. Enter는 전송, Shift+Enter는 줄바꿈이며 한글 조합 중 Enter는 전송하지 않습니다.

검증 명령:

```bash
npm run check
npm run build
npx firebase emulators:exec --config firebase.e2e.json --project demo-collezio --only auth,firestore,storage "node --test tests/integration/chat.rules.test.mjs && npx playwright test tests/e2e/chat.spec.ts"
```

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
