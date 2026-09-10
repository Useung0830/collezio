# Git 컨벤션

개인 프로젝트에서 일관된 Git 이력을 유지하기 위한 최소 규칙을 정의한다.
Issue와 Pull Request는 작업 규모에 따라 선택적으로 사용한다.

## 브랜치 구조

```text
main
└── dev
    ├── feat/auth-ui
    ├── fix/login-redirect
    └── refactor/product-card
```

- `main`: 배포 가능한 코드를 관리한다.
- `dev`: 완료된 기능을 통합하고 작업 브랜치의 기준으로 사용한다.
- 작업 브랜치: 기능이나 수정 사항을 독립적으로 구현한다.

초기에는 `release/*` 브랜치를 사용하지 않는다. 별도 QA 과정이 필요해지면
도입한다.

## 작업 브랜치

| 종류      | 형식                | 예시                    |
| --------- | ------------------- | ----------------------- |
| 기능      | `feat/기능명`       | `feat/auth-ui`          |
| 버그 수정 | `fix/수정내용`      | `fix/login-redirect`    |
| 리팩토링  | `refactor/작업내용` | `refactor/product-card` |
| 문서      | `docs/작업내용`     | `docs/git-convention`   |

브랜치 이름은 영문 소문자와 하이픈을 사용한다. Issue가 있다면
`feat/12-auth-ui`처럼 번호를 포함할 수 있다.

## 기본 작업 흐름

```bash
git switch dev
git pull --ff-only origin dev
git switch -c feat/auth-ui

# 기능 구현 및 검사
npm run check

git add <변경한 파일>
git commit -m "feat: 인증 페이지 UI 구현"

git switch dev
git merge --squash feat/auth-ui
git commit -m "feat: 인증 페이지 UI 구현"
git push origin dev
git branch -d feat/auth-ui
```

- 최신 `dev`에서 작업을 시작한다.
- 하나의 브랜치에는 하나의 명확한 작업 단위만 포함한다.
- 병합 전 `npm run check`를 실행한다.
- 병합을 완료한 작업 브랜치는 삭제한다.

## Issue 사용 기준

Issue와 GitHub Projects는 필수가 아니다. 다음과 같이 작업 범위나 진행 상황을
별도로 관리할 가치가 있을 때 사용한다.

- 여러 단계로 나뉘는 기능
- 요구사항이나 결정 사항을 기록해야 하는 작업
- 장기간 진행하거나 나중에 다시 확인할 작업
- 버그의 재현 조건과 해결 과정을 남길 작업

단순 UI 수정, 오타, 작은 문서 변경은 Issue 없이 진행할 수 있다.

## Pull Request 사용 기준

혼자 작업할 때는 작업 브랜치를 로컬에서 `dev`에 직접 병합할 수 있다. 다음
경우에는 셀프 리뷰를 위해 Pull Request 사용을 권장한다.

- 변경 범위가 크거나 위험도가 높은 경우
- 병합 전에 전체 diff를 검토하고 싶은 경우
- GitHub Actions 검사를 통과한 뒤 병합하려는 경우
- `main`에 배포 변경을 반영하는 경우

PR을 사용한다면 기능 작업의 대상은 `dev`, 배포의 대상은 `main`으로 한다.
Issue가 있다면 PR 본문에 `Closes #12`처럼 연결할 수 있다.

PR 제목·본문 작성은 [PR 작성 컨벤션](pr-conventions.md)을 따르며,
[기본 템플릿](../../.github/pull_request_template.md)의 안내에 맞춰 작성한다.

## 커밋 기준

커밋은 해당 커밋만 되돌렸을 때 하나의 독립적인 변경이 취소되는 단위로 나눈다.
반드시 함께 변경되어야 하는 코드를 억지로 분리하지 않고, 서로 관계없는 변경은
같은 커밋에 포함하지 않는다.

커밋 전 다음 사항을 확인한다.

- 커밋 메시지만으로 작업 내용을 이해할 수 있는가?
- 관계없는 파일이 포함되지 않았는가?
- 불필요한 `console.log`와 사용하지 않는 코드가 없는가?
- TypeScript, ESLint, Prettier 검사를 통과했는가?

## 커밋 메시지

```text
type: 작업 내용
```

| Type       | 용도                                   |
| ---------- | -------------------------------------- |
| `feat`     | 새로운 기능                            |
| `fix`      | 버그 수정                              |
| `docs`     | 문서 수정                              |
| `chore`    | 설정 및 기타 관리 작업                 |
| `style`    | 동작에 영향을 주지 않는 코드 형식 변경 |
| `refactor` | 기능 변화 없는 구조 개선               |
| `test`     | 테스트 추가 및 수정                    |

예시:

```text
feat: 로그인 폼 UI 구현
fix: 로그인 리다이렉트 오류 수정
docs: 로컬 실행 방법 추가
refactor: 상품 카드 로직 분리
```

`수정`, `최종`, `update`, `work`처럼 변경 내용을 알 수 없는 메시지는 사용하지
않는다.

### 커밋 작성 주체 표기

- 커밋 메시지에는 코드나 문서를 AI가 작성했다는 내용을 넣지 않는다.
- `Co-authored-by` 등 AI 도구를 작성자로 표시하는 트레일러를 추가하지 않는다.
- 커밋은 변경 목적과 결과만 설명하며, 사용한 도구는 커밋 메시지에 기록하지 않는다.

## 긴급 수정

배포된 `main`에서 긴급한 문제가 발견되면 `main`에서 `fix/*` 브랜치를 만든다.
수정을 `main`에 반영한 후 같은 변경을 `dev`에도 반영한다.

```bash
git switch main
git switch -c fix/production-auth-error
```
