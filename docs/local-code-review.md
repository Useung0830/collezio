# 로컬 코드 리뷰

GitHub Actions는 타입·린트·단위 테스트·빌드·E2E를 실행하고, 로컬 PC의 Ollama가 PR을 검토한다.
로컬 프로그램은 GitHub REST API로 문서를 읽을 뿐 PR 브랜치를 checkout하거나 PR 코드를 실행하지 않는다.
self-hosted runner 설치, 모델 서버 공개, Anthropic API 키는 필요하지 않다.

## 병합 흐름

1. 같은 저장소의 `dev` 대상 PR에 기존 워크플로가 자동 병합을 활성화한다.
2. 로컬 프로그램이 새 PR/커밋을 찾아 `Local Code Review`를 pending으로 표시한다.
3. 모델 결과를 검증하고 GitHub 인라인 리뷰 댓글을 게시한 뒤 상태를 success로 바꾼다.
4. 지적을 처리한 후 각 댓글의 **Resolve conversation**을 누른다.
5. 모든 대화 해결과 `Check and Build`, `Signup E2E`, `Local Code Review` 성공 후 자동 Squash Merge된다.

지적이 없으면 별도의 확인 없이 필수 검사 통과 후 병합된다. `Viewed` 체크박스와는 관계없다.
새 커밋은 다시 검토한다. 이전 커밋의 미해결 댓글은 사람의 판단 없이 닫지 않는다.
같은 커밋의 성공한 리뷰는 재실행해도 중복 게시하지 않는다.
`main` 대상도 리뷰하지만 자동 병합은 하지 않는다.

## 준비

- Node.js 24, Git 및 GitHub 로그인(리뷰 댓글과 commit status 작성 권한)
- 실행 중인 Ollama: `http://127.0.0.1:11434`
- 로컬에 다운로드한 모델: 기본값 `gemma4:12b`
- `dev` ruleset에 필수 검사 `Local Code Review` 추가(앱 제한 없음)
- `dev` ruleset의 `required_review_thread_resolution` 활성화

프로그램은 `GH_TOKEN`이 있으면 사용하고, 없으면 Git credential helper에서 GitHub 인증을 메모리로 읽는다.
토큰은 로그나 파일에 저장하지 않는다. 전용 토큰을 쓸 경우 이 저장소의 Contents 읽기,
Pull requests 읽기/쓰기, Commit statuses 읽기/쓰기 권한을 부여한다.
댓글 작성자는 해당 인증 계정이다. 별도 봇 계정을 사용하려면 그 계정의 토큰을 사용한다.

## 실행

```powershell
# 게시 없이 기존 PR을 시험 검토한다(닫힌 PR도 가능).
npm run review:local -- --pr 14 --dry-run

# 현재 열린 PR을 한 번 검토하고 게시한다.
npm run review:local

# 60초마다 열린 PR을 확인한다. 종료: Ctrl+C
npm run review:watch

# 실패한 PR을 명시적으로 다시 검토한다.
npm run review:local -- --pr 15

# 이미 다운로드한 다른 로컬 모델로 변경한다.
$env:LOCAL_REVIEW_MODEL = "설치한-모델:태그"
npm run review:watch
```

PC와 Ollama가 실행 중이어야 한다. 재부팅 후에는 감시 프로그램도 다시 실행한다.
실패한 커밋은 반복 호출하지 않는다. 로그 확인 후 `--pr 번호`로 재시도하거나 새 커밋을 올린다.
비정상 종료로 pending이 남으면 30분 후 감시 프로그램이 다시 시도한다.
동시에 여러 감시 프로그램을 실행하지 않는다.

## 검토 범위와 제한

- 모델에는 변경 파일의 diff·내용, 다른 변경 파일 목록, base 커밋의 관련 컨벤션을 전달한다.
- 저장소 전체와 모든 호출 관계를 탐색하는 에이전트가 아니다. 교차 파일 오류를 놓칠 수 있다.
- 최대 30개 변경 파일, 파일별 입력 48KB, 문맥 32K 토큰, 출력 2,048토큰으로 제한한다.
- 바이너리 이미지·폰트·동영상·PDF 및 `package-lock.json`은 모델 검토에서 제외한다.
- diff 누락, 비밀 설정 파일, 입력 초과, 시간 초과, 잘못된 JSON·줄 번호, 미완료 결과는 실패 처리한다.
- 파일은 메모리로 읽고 Ollama에는 로컬 주소로만 전달한다. 클라우드 모델은 거부한다.
- 출력 형식과 완료 상태를 검증해도 모델 판단의 정확성은 보장하지 않는다.

RTX 3080 12GB / RAM 64GB 환경에서 설치된 `gemma4:12b`로 시험을 시작했다.
작은 합성 테스트에서 사용자 조회 필터 누락은 찾았지만 최신순 정렬 오류는 놓쳤다.
기존 PR #14의 파일 10개 시험 검토는 약 61초에 완료했지만, 정상 화면 너비 테스트에
확인되지 않은 Playwright API를 제안하는 오탐도 있었다.
따라서 Claude와 동급으로 검증된 구성이 아니며, 실제 PR에서 놓친 문제와 오탐을 기록하며 평가한다.
Claude API 호출이나 유료 클라우드로의 자동 대체는 하지 않는다.

## 개발 검증

```powershell
npm run check
npm run test:unit
```

리뷰 게시 코드의 단위 테스트는 결과 검증, 잘못된 위치 거부, 오래된 커밋 거부,
동일 커밋 중복 방지를 확인한다. 모델의 리뷰 품질 자체를 증명하지는 않는다.
