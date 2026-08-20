# 머지 전략

## 기본 전략

브랜치의 목적에 따라 Merge 방식을 구분합니다.

| Merge 방향               | 전략         |
| ------------------------ | ------------ |
| `feat/*` → `develop`     | Squash Merge |
| `fix/*` → `develop`      | Squash Merge |
| `refactor/*` → `develop` | Squash Merge |
| `docs/*` → `develop`     | Squash Merge |
| `develop` → `main`       | Merge Commit |
| `release/*` → `main`     | Merge Commit |
| `hotfix/*` → `main`      | Merge Commit |
| `hotfix/*` → `develop`   | Merge Commit |

---

## Feature → Develop

기능 브랜치를 `develop`에 병합할 때는 **Squash Merge**를 사용합니다.

```text
feat/12-login-page
        ↓
   Squash Merge
        ↓
     develop
```

기능 개발 과정에서는 작업 내용을 구분해 여러 커밋을 작성할 수 있습니다.

```text
feat: 로그인 폼 UI 구현
feat: 로그인 입력값 검증 추가
feat: 로그인 API 연동
fix: 로그인 에러 메시지 수정
```

하지만 Pull Request가 `develop`에 병합될 때는 하나의 커밋으로 합칩니다.

```text
feat: 로그인 기능 구현 (#12)
```

### Squash Merge를 사용하는 이유

- 하나의 Issue를 하나의 기능 단위로 관리할 수 있습니다.
- 개발 과정의 세부 커밋이 `develop` 히스토리를 복잡하게 만들지 않습니다.
- 기능 단위로 Commit History를 확인하기 쉽습니다.
- 특정 기능 전체를 되돌리기 쉽습니다.
- 개인 프로젝트에서도 깔끔한 Git History를 유지할 수 있습니다.

---

## Squash Commit Message

Squash Merge 시 최종 커밋 메시지는 해당 Issue의 주요 작업 내용을 기준으로 작성합니다.

형식:

```text
type: 작업 내용 (#이슈번호)
```

예시:

```text
feat: 로그인 기능 구현 (#12)

feat: 상품 등록 기능 구현 (#18)

fix: 로그인 리다이렉트 오류 수정 (#31)

refactor: 상품 카드 구조 개선 (#42)
```

PR 안에서는 여러 커밋이 존재할 수 있지만 `develop`에는 하나의 기능 단위 커밋만 남도록 합니다.

---

## Develop → Main

배포 시 `develop`을 `main`으로 병합할 때는 **Merge Commit**을 사용합니다.

```text
develop
   ↓
Merge Commit
   ↓
 main
```

예:

```text
Merge develop into main for v1.0.0
```

또는

```text
release: v1.0.0
```

### Merge Commit을 사용하는 이유

`develop`에서 어떤 시점의 기능들이 `main`에 배포되었는지 명확하게 구분하기 위함입니다.

예:

```text
main

● v1.0.0 배포
│
├─ feat: 로그인 기능 구현 (#12)
├─ feat: 회원가입 기능 구현 (#13)
├─ feat: 상품 등록 기능 구현 (#18)
│
● v1.1.0 배포
```

기능 단위 기록은 유지하면서 배포 시점도 Git History에서 확인할 수 있습니다.

---

## Release Branch 사용 시

Release Branch가 필요한 경우 `develop`에서 생성합니다.

```text
develop
   ↓
release/1.0.0
   ↓
 main
```

Release Branch에서는 새로운 기능을 추가하지 않습니다.

다음 작업만 허용합니다.

- 배포 전 버그 수정
- 문구 수정
- 버전 변경
- 환경 설정 수정
- QA 과정에서 발견된 문제 수정

배포 준비가 완료되면 `main`에 Merge Commit으로 병합합니다.

```text
release/1.0.0
       ↓
  Merge Commit
       ↓
      main
```

Release 과정에서 수정된 코드가 있다면 `develop`에도 반영합니다.

```text
release/1.0.0
     ├── main
     └── develop
```

프로젝트 규모가 작고 별도의 QA 과정이 없다면 Release Branch는 사용하지 않고 다음 흐름을 사용합니다.

```text
develop
   ↓
 main
```

---

## Hotfix Merge

이미 배포된 `main`에서 긴급한 문제가 발생한 경우 `hotfix` 브랜치를 생성합니다.

```text
main
 ↓
hotfix/63-auth-error
```

수정이 완료되면 `main`으로 Merge Commit합니다.

```text
hotfix/63-auth-error
        ↓
   Merge Commit
        ↓
       main
```

같은 문제가 이후 개발 코드에 다시 발생하지 않도록 변경사항을 `develop`에도 반영합니다.

```text
hotfix/63-auth-error
      ├── main
      └── develop
```

---

## Rebase 사용 규칙

작업 브랜치가 오래되어 `develop`과 차이가 많이 발생한 경우 최신 변경사항을 반영하기 위해 Rebase를 사용할 수 있습니다.

예:

```bash
git switch develop
git pull origin develop

git switch feat/12-login-page
git rebase develop
```

충돌을 해결한 뒤 작업을 계속합니다.

단, 이미 다른 사람이 함께 사용하고 있는 공유 브랜치에서는 임의로 Rebase하지 않습니다.

개인 작업 브랜치에서는 Rebase 사용을 허용합니다.

---

## Merge Conflict 처리

충돌이 발생하면 GitHub에서 무조건 자동 병합하지 않고 충돌 내용을 직접 확인합니다.

다음 순서로 처리합니다.

1. `develop`의 최신 변경사항을 가져옵니다.
2. 작업 브랜치에 Rebase 또는 Merge합니다.
3. 충돌한 파일을 직접 확인합니다.
4. 필요한 코드만 남기고 충돌을 해결합니다.
5. 프로젝트가 정상적으로 실행되는지 확인합니다.
6. TypeScript / ESLint 오류를 확인합니다.
7. 다시 Push합니다.
8. Pull Request에서 최종 변경사항을 확인합니다.

충돌 표시를 그대로 Commit하지 않도록 주의합니다.

```text
<<<<<<< HEAD
=======
>>>>>>> develop
```

---

## Merge 전 확인

Merge 전에 다음 항목을 확인합니다.

- Pull Request의 대상 브랜치가 올바른지
- 관련 Issue가 연결되어 있는지
- 구현한 기능이 정상 동작하는지
- Merge Conflict가 없는지
- TypeScript 오류가 없는지
- ESLint 오류가 없는지
- 불필요한 `console.log`가 없는지
- 관계없는 파일이 포함되지 않았는지
- Squash Commit Message가 작업 내용을 명확하게 설명하는지

---

## Merge 후 작업

Feature Branch가 `develop`에 정상적으로 병합되면 해당 작업 브랜치는 삭제합니다.

```text
feat/12-login-page
        ↓
     develop
        ↓
Feature Branch 삭제
```

이미 병합된 브랜치를 장기간 유지하지 않습니다.

GitHub Issue가 정상적으로 종료되었는지 확인하고 GitHub Projects 상태를 `Done`으로 변경합니다.

---

## 최종 Merge Flow

일반적인 기능 개발:

```text
GitHub Issue #12
        ↓
feat/12-login-page
        ↓
여러 작업 Commit
        ↓
Pull Request
        ↓
Squash Merge
        ↓
develop
```

배포:

```text
develop
   ↓
Merge Commit
   ↓
 main
   ↓
배포
```

긴급 수정:

```text
main
 ↓
hotfix/*
 ↓
수정
 ↓
Merge Commit
 ├── main
 └── develop
```

## 최종 원칙

- 기능 개발 과정에서는 작업 내용을 기준으로 커밋을 나눕니다.
- Feature Branch를 `develop`에 병합할 때는 `Squash Merge`를 사용합니다.
- 하나의 Issue가 `develop`에서는 하나의 대표 커밋으로 남도록 합니다.
- 배포를 위한 `develop → main` 병합은 `Merge Commit`을 사용합니다.
- 배포 시점과 기능 개발 히스토리를 구분합니다.
- 작업이 끝난 Feature Branch는 삭제합니다.
- 작업 중 최신 `develop` 반영이 필요한 경우 개인 브랜치에서 Rebase를 사용할 수 있습니다.
