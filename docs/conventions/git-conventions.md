# Git 컨벤션

## 브랜치 구조

프로젝트는 기본적으로 다음 브랜치를 사용합니다.

```text
main
└── develop
    ├── feat/12-login-page
    ├── feat/18-product-create
    └── feat/25-profile-edit
```

프로젝트 규모가 작기 때문에 주로 다음 브랜치를 사용합니다.

- `main`
- `develop`
- `feat/*`

필요한 경우 다음 브랜치를 추가합니다.

- `fix/*`
- `refactor/*`
- `docs/*`
- `release/*`
- `hotfix/*`

## 브랜치 역할

### main

실제 배포 가능한 코드를 관리합니다.

- 항상 정상적으로 실행 가능한 상태를 유지합니다.
- 직접 기능 개발을 진행하지 않습니다.
- 직접 Push하지 않는 것을 원칙으로 합니다.
- 일반적인 배포는 `develop`을 통해 반영합니다.
- 긴급 수정은 `hotfix`를 통해 반영합니다.

### develop

개발된 기능이 통합되는 브랜치입니다.

- 새로운 작업 브랜치의 기준 브랜치입니다.
- 직접 기능 개발을 진행하지 않습니다.
- 일반 Feature PR의 Target 브랜치입니다.

### feat/*

GitHub Issue에 등록된 기능을 구현하는 브랜치입니다.

기능 구현이 완료되면 `develop`으로 Pull Request를 생성합니다.

### release/*

배포 전 별도의 QA 또는 버전 관리가 필요한 경우 선택적으로 사용합니다.

```text
release/1.0.0
```

프로젝트 규모가 작고 별도 QA 과정이 없다면 생략할 수 있습니다.

### hotfix/*

이미 `main`에 배포된 기능에서 긴급한 문제가 발생한 경우 사용합니다.

`main`에서 생성하며 수정 후 `main`과 `develop` 모두에 변경사항을 반영합니다.

---

## GitHub Issue 기반 작업

모든 기능 개발은 GitHub Issue 생성 후 시작하는 것을 원칙으로 합니다.

작업 흐름:

1. GitHub Issue 생성
2. GitHub Projects 등록
3. 작업 시작 시 `In Progress`로 변경
4. `develop`에서 Issue 기반 브랜치 생성
5. 기능 구현
6. Commit
7. Push
8. Pull Request 생성
9. `Review`로 변경
10. `develop` 병합
11. Issue 종료
12. `Done`으로 변경
13. 작업 브랜치 삭제

단순 오타나 매우 작은 문서 수정은 필요에 따라 Issue 생성을 생략할 수 있습니다.

---

## Issue 작성 기준

하나의 Issue는 하나의 명확한 작업 단위를 가집니다.

권장:

```text
#12 로그인 페이지 구현
#13 소셜 로그인 구현
#14 상품 등록 구현
```

지양:

```text
#12 로그인 + 회원가입 + 마이페이지 + 프로필 수정
```

가능하면 하나의 Issue가 하나의 Pull Request로 연결될 수 있도록 작업 범위를 설정합니다.

---

## GitHub Projects 상태

기본 상태는 다음과 같이 사용합니다.

```text
Todo
→ In Progress
→ Review
→ Done
```

### Todo

아직 시작하지 않은 작업

### In Progress

작업 브랜치를 생성하고 개발을 시작한 작업

### Review

Pull Request를 생성한 작업

### Done

Pull Request가 병합되어 완료된 작업

---

## 브랜치 명명 규칙

### 기능 개발

```text
feat/이슈번호-기능명
```

예시:

```text
feat/12-login-page
feat/18-product-create
feat/25-profile-edit
```

### 버그 수정

```text
fix/이슈번호-수정내용
```

예시:

```text
fix/31-login-redirect
```

### 리팩토링

```text
refactor/이슈번호-작업내용
```

예시:

```text
refactor/42-product-card
```

### 문서

```text
docs/이슈번호-작업내용
```

예시:

```text
docs/51-readme
```

### 긴급 수정

```text
hotfix/이슈번호-수정내용
```

예시:

```text
hotfix/63-auth-error
```

### Release

```text
release/버전
```

예시:

```text
release/1.0.0
```

브랜치의 기능명은 다음 규칙을 따릅니다.

- 영문 소문자 사용
- 단어 구분은 하이픈(`-`) 사용
- 작업 내용을 알아볼 수 있도록 작성
- 지나치게 긴 이름은 지양

---

## 기능 구현 및 Commit 기준

기능 전체를 하나의 커밋으로 몰아서 저장하지 않습니다.

커밋은 다음 기준으로 나눕니다.

> 해당 커밋만 되돌렸을 때 하나의 독립적인 변경사항이 취소될 수 있는 단위

예를 들어 로그인 기능을 구현한다면 다음과 같이 나눌 수 있습니다.

```text
feat: 로그인 폼 UI 구현
feat: 로그인 API 연동
feat: 로그인 입력값 검증 추가
feat: 로그인 성공 후 리다이렉트 구현
fix: 로그인 실패 메시지 표시 오류 수정
```

다음 작업의 성격이 달라지는 경우 별도 커밋으로 분리하는 것을 권장합니다.

- 새로운 UI 추가
- 새로운 사용자 동작 추가
- API 연동
- Validation 추가
- 버그 수정
- 코드 구조 리팩토링
- 테스트 추가
- 프로젝트 설정 변경
- 기존 기능과 관계없는 스타일 변경

예시:

```text
feat: 상품 등록 폼 UI 구현
feat: 상품 이미지 업로드 기능 추가
feat: 상품 등록 API 연동
feat: 상품 등록 입력값 검증 추가
refactor: 상품 등록 폼 로직 분리
fix: 이미지 삭제 후 미리보기가 유지되는 오류 수정
```

반대로 하나의 기능을 구현하기 위해 반드시 함께 변경되어야 하는 코드는 억지로 여러 커밋으로 분리하지 않습니다.

커밋 전에 다음 기준으로 확인합니다.

- 이 커밋만 봐도 어떤 작업인지 설명할 수 있는가?
- 이 커밋만 되돌렸을 때 하나의 변경사항만 제거되는가?
- 서로 관계없는 변경사항이 섞여 있지 않은가?

---

## Commit Message

다음 형식을 사용합니다.

```text
type: 작업 내용
```

사용 가능한 Type:

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정 (README 등)
- `chore`: 사소한 작업 및 프로젝트 설정 변경
- `style`: 코드 포맷팅, 세미콜론 누락 등 코드 동작에 영향을 주지 않는 변경
- `refactor`: 기능 변화 없이 코드 구조 개선
- `test`: 테스트 코드 추가 및 수정

예시:

```text
feat: 로그인 폼 UI 구현
feat: 상품 등록 API 연동
fix: 로그인 리다이렉트 오류 수정
docs: 프로젝트 실행 방법 추가
chore: eslint 설정 변경
style: import 순서 정리
refactor: 상품 카드 로직 분리
test: 로그인 validation 테스트 추가
```

다음과 같이 작업 내용을 알 수 없는 메시지는 사용하지 않습니다.

```text
수정
수정2
최종
진짜최종
update
work
asdf
```

서로 관련 없는 변경사항은 하나의 커밋에 포함하지 않습니다.

권장:

```text
feat: 로그인 기능 구현
style: 헤더 디자인 수정
```

지양:

```text
feat: 로그인 구현 및 헤더 디자인 수정
```

---

## Pull Request

기능 개발 완료 후 작업 브랜치에서 `develop`을 대상으로 Pull Request를 생성합니다.

```text
feat/12-login-page
        ↓
       PR
        ↓
     develop
```

PR 제목은 다음 형식을 사용합니다.

```text
[#이슈번호] 작업 내용
```

예시:

```text
[#12] 로그인 페이지 구현
```

Issue 자동 종료가 필요한 경우 PR 본문에 다음 문구를 작성합니다.

```text
Closes #12
```

---

## PR 전 확인

Pull Request 생성 전에 다음 내용을 확인합니다.

- 구현한 기능이 정상적으로 동작하는지
- Issue의 요구사항을 모두 구현했는지
- TypeScript 오류가 없는지
- ESLint 오류가 없는지
- 사용하지 않는 변수와 Import가 없는지
- 불필요한 `console.log`가 없는지
- 테스트가 존재한다면 정상적으로 통과하는지
- 기능과 관계없는 파일이 수정되지 않았는지
- 반응형 UI가 필요한 경우 주요 화면 크기를 확인했는지
