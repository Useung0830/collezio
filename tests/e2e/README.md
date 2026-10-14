# 회원가입 E2E 테스트

Playwright와 Firebase Authentication Emulator로 운영 계정을 만들지 않고
회원가입 화면을 검사합니다. 테스트를 실행하기 위해 Firebase에 로그인하거나
서비스 계정 키를 등록할 필요는 없습니다.

## 준비

프로젝트에서 사용하는 Node.js 24와 Java 21을 준비한 뒤 실행합니다.

```sh
npm ci
npx playwright install chromium
```

Linux CI에서는 브라우저 설치에 `--with-deps` 옵션을 추가합니다.

## 실행

```sh
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:report
```

- `test:e2e`: Emulator 시작 → 테스트 전용 빌드 → 앱 실행 → 테스트 → 종료
- `test:e2e:headed`: 브라우저 창을 표시하며 같은 테스트 실행
- `test:e2e:report`: 가장 최근 HTML 보고서 열기

포트 `3100`과 `9099`는 비어 있어야 합니다. 기존 서버는 재사용하지 않습니다.
앱 빌드는 `.next-e2e`에 저장하므로 일반 `.next` 빌드와 분리됩니다.
Next.js가 자동 생성하는 `next-env.d.ts`는 공유하므로 일반 빌드와 테스트 빌드는
동시에 실행하지 마세요. 일반 환경으로 돌아갈 때 `npx next typegen`으로
타입 참조를 다시 생성할 수 있습니다.

## 검사 범위

1. 빈 입력 상태에서 버튼 비활성화
2. 필수 약관 동의에 따른 버튼 활성화 및 비활성화
3. 비밀번호 확인 불일치 오류
4. 가입 성공 토스트와 `/login` 이동
5. 중복 이메일 오류와 `/signup` 유지

실패 메시지는 현재 구현대로 입력란 아래에 표시되는 문구를 검사합니다.
이메일 실제 수신과 인증 링크 클릭, 로그인 기능은 이 테스트 범위에 포함하지 않습니다.

## 운영 환경 보호

- 프로젝트 ID는 `demo-collezio`로 고정합니다.
- 테스트 앱에는 `playwright.config.ts`에서 가짜 Firebase 설정을 전달합니다.
- `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`는 테스트 앱에만 적용합니다.
- 이 플래그를 Vercel에 등록하거나 테스트 빌드를 운영 배포에 사용하지 마세요.
- 공용 fixture가 운영 Firebase 인증 API 요청을 차단하고 테스트를 실패시킵니다.
- 테스트마다 고유 이메일을 사용하고 Emulator 종료 시 계정 데이터를 폐기합니다.

## CI 및 결과물

기존 CI의 `Signup E2E` 작업이 동일한 명령을 실행합니다.
실패 시 스크린샷과 trace를 저장하고, CI는 보고서를 7일 동안 보관합니다.
`playwright-report`, `test-results` 및 Emulator 로그는 커밋하지 않습니다.

변경 사항을 커밋·푸시하고 첫 CI 성공을 확인한 뒤 GitHub Ruleset의 필수 검사에
`Signup E2E`를 추가하세요. 기존 `Check and Build` 검사도 유지합니다.
