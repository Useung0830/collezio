This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 커뮤니티

구현 범위, 데이터 처리, 실패 복구와 로컬 검증 방법은 [커뮤니티 구현 현황](docs/community.md)을 참고하세요.

## 채팅 신고와 차단

- 신고는 `users/{신고자ID}/chatReports/{신고ID}`에 저장합니다. 채팅 상대만 신고할 수 있으며, 신고자만 개별 접수 내용을 조회할 수 있습니다. 상대방은 신고 내용을 읽을 수 없습니다.
- 신고 사유와 최대 1,000자의 상세 내용을 받으며, 기타 사유는 상세 내용이 필수입니다. 실패 후 같은 요청 ID로 재시도해 중복 저장을 방지합니다. 신고 접수는 자동 차단이나 관리자 제재를 수행하지 않습니다.
- 차단은 `users/{사용자ID}/chatBlocks/{상대ID}`에 저장하며, 해당 사용자와의 모든 채팅방에 적용합니다. 기존 메시지와 목록은 유지하고 양쪽의 새 메시지 전송 및 새 채팅방 생성을 제한합니다.
- 차단 목록은 본인만 조회할 수 있습니다. 상대방은 자신과의 차단 문서만 조회할 수 있으며 화면에는 일반적인 전송 불가 안내를 표시합니다. 상호 차단은 양쪽 모두 해제해야 전송을 재개할 수 있습니다.
- 관리자 신고 처리 화면과 사진 전송은 후속 작업입니다. 운영 반영 시 애플리케이션과 함께 `firestore.rules`를 대상 Firebase 프로젝트에 배포해야 합니다. 로컬 테스트는 운영 규칙을 배포하지 않습니다.

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
