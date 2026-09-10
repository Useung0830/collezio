# 머지 전략

개인 프로젝트에서는 기능 단위 이력을 유지하면서 관리 비용을 줄이기 위해 두
가지 병합 방식만 사용한다.

| Merge 방향          | 전략         |
| ------------------- | ------------ |
| 작업 브랜치 → `dev` | Squash Merge |
| `dev` → `main`      | Merge Commit |

## 작업 브랜치에서 dev로 병합

`feat/*`, `fix/*`, `refactor/*`, `docs/*` 브랜치는 Squash Merge로 `dev`에
병합한다. 작업 중 작성한 여러 커밋을 `dev`에는 하나의 작업 단위 커밋으로
남길 수 있다.

```bash
git switch dev
git pull --ff-only origin dev
git merge --squash feat/auth-ui
git commit -m "feat: 인증 페이지 UI 구현"
git push origin dev
```

`git merge --squash`는 변경 사항만 스테이징하며 커밋을 자동 생성하지 않는다.
병합 내용을 확인한 후 별도로 커밋해야 한다.

PR을 사용하는 경우 GitHub의 Squash and merge로 같은 결과를 만들 수 있다.

## PR 자동 병합

`.github/workflows/auto-merge.yml`은 같은 저장소에서 생성한 `dev` 대상 PR의
자동 병합을 활성화한다. 필수 검사와 리뷰 등 브랜치 규칙을 모두 충족하면
Squash Merge로 병합된다. 충돌은 직접 해결해야 한다.

- Draft PR은 준비 완료로 전환한 뒤 자동 병합을 활성화한다.
- PR을 Draft로 전환하거나 대상을 `main`으로 바꾸면 자동 병합을 해제한다.
- 외부 fork PR은 자동화 대상에서 제외한다.
- `main` 대상 PR은 직접 확인한 뒤 Merge Commit으로 병합한다.

저장소의 **Allow auto-merge**와 **Allow squash merging**이 켜져 있어야 한다.
`dev` 규칙에는 `Check and Build`, `Signup E2E`를 필수 검사로 등록한다.
`Configure Auto Merge`는 필수 검사로 지정하지 않는다.

이 워크플로우는 `pull_request_target`을 사용하므로 저장소 기본 브랜치에 먼저
반영해야 한다. 최초 도입 PR은 직접 병합하거나 자동 병합 버튼을 눌러 처리한다.
반영 이후 새 PR 생성, 커밋 추가, PR 재열기, 준비 상태 또는 대상 변경 시 실행된다.
PR 코드를 체크아웃하거나 실행하는 단계를 이 워크플로우에 추가하지 않는다.

기본 `GITHUB_TOKEN`을 사용하며 별도 PAT는 필요하지 않다. 이 토큰으로 발생한
병합의 `push` 이벤트는 다른 Actions 실행을 유발하지 않으므로 PR의 필수 검사를
병합 기준으로 삼는다. 향후 병합 후 배포 워크플로우를 추가할 때는 실행 방식을
별도로 구성한다.

## dev에서 main으로 병합

배포할 시점에는 `dev`를 `main`에 Merge Commit으로 병합한다. 기능 단위 커밋을
유지하면서 배포 시점을 구분할 수 있다.

```bash
git switch main
git pull --ff-only origin main
git merge --no-ff dev
git push origin main
```

배포 단위가 명확하다면 merge commit 메시지나 태그에 버전을 기록한다.

```text
release: v1.0.0
```

## 충돌 처리

충돌이 발생하면 충돌 파일을 직접 확인하고 필요한 코드만 남긴다.

`<<<<<<<`, `=======`, `>>>>>>>`와 같은 충돌 표시가 남지 않았는지 확인하고
해결 후 `npm run check`를 실행한다. 병합을 취소하려면 상황에 따라
`git merge --abort`를 사용한다.

## 병합 전 확인

- 작업 브랜치가 최신 `dev`를 기준으로 하는가?
- 구현한 기능이 정상적으로 동작하는가?
- `npm run check`를 통과하는가?
- 관계없는 파일이나 디버깅 코드가 포함되지 않았는가?
- 최종 커밋 메시지가 작업 내용을 명확하게 설명하는가?

## 병합 후 정리

병합이 완료되면 더 이상 사용하지 않는 작업 브랜치를 삭제한다.

```bash
git branch -d feat/auth-ui
git push origin --delete feat/auth-ui # 원격 브랜치가 있을 때만 실행
```

Issue나 Project를 사용한 작업이라면 완료 상태로 변경한다. 사용하지 않았다면
별도의 관리 절차는 필요하지 않다.
