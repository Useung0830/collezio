# 공개 프로필

상품의 `sellerId`로 `profiles/{uid}`를 별도 조회한다. 프로필 실패는 상품 조회 결과에 영향을 주지 않는다. 마이페이지도 같은 프로필을 사용한다.

## 저장 데이터

- `nickname`: 가입 시 Auth의 `displayName`에서 가져오는 닉네임
- `imageUrl`: 프로필 사진 URL. 최초 생성 시 `null`
- `imagePath`: 사진 변경 시 저장하는 `profiles/{uid}/{imageId}` Storage 경로
- `bio`: 자기소개. 최초 생성 시 빈 문자열
- `createdAt`: 서버 생성 시각
- `rating`, `tradeCount`: 추후 서버 집계용 선택 필드. 클라이언트 생성·수정 금지

이메일 등 비공개 계정 정보는 저장하지 않는다. 사진이 없거나 주소가 잘못되면 기본 아이콘을 표시한다. 집계 필드가 없으면 평가 없음·거래 횟수 미집계로 표시한다.

## 생성과 기존 계정

신규 가입 전에 닉네임 사용 여부를 확인하고 프로필 생성 시 서버에서 다시 검사한다. 동시에 같은 닉네임으로 가입해 중복이 발생하면 이번에 만든 Auth 계정을 정리하고 닉네임 오류를 표시한다. 일시적인 프로필 저장 오류는 기존처럼 본인 프로필 조회 때 복구를 시도한다. 기존 계정은 본인 프로필 조회 또는 상품 등록 시 문서가 없으면 생성하며, 이미 있는 문서를 덮어쓰지 않는다.

아직 방문하지 않은 기존 판매자는 프로필이 없을 수 있다. 다른 사용자의 프로필을 Auth 정보로 임의 생성하지 않으며 프로필 미등록 상태를 표시한다.

## 권한과 범위

`firestore.rules`는 공개 단건 조회만 허용한다. 프로필 생성·변경은 `saveProfile` Callable Function에서 인증된 본인 계정만 처리하며, 직접 쓰기·목록 조회는 차단한다. 집계·생성일·자기소개는 클라이언트 입력으로 변경하지 않는다. 탈퇴 처리 중인 계정은 수정·업로드할 수 없다.

`checkNickname`은 닉네임 사용 가능 여부만 반환한다. 앞뒤 공백을 제거한 2~10자 문자열을 비교하며 대소문자는 구분한다. `saveProfile`은 `nicknames/{SHA-256(nickname)}`의 소유자와 기존 `profiles.nickname`을 함께 확인하고, 소유권과 프로필을 같은 트랜잭션에서 저장한다. 이름 변경·탈퇴 시 본인 소유의 이전 이름을 반환한다. 닉네임 인덱스는 클라이언트에서 읽거나 쓸 수 없다.

기존 프로필도 인덱스 유무와 관계없이 중복 검사 대상이다. 기존에 중복 저장된 이름은 자동으로 개명하지 않으며, 사용자가 고유한 이름으로 변경해야 한다. 공개 프로필이 없는 이전 Auth 계정의 displayName은 예약된 이름으로 간주하지 않는다.

마이페이지 상단의 수정 버튼에서 닉네임(앞뒤 공백 제거 후 2~10자)과 사진(JPG·PNG·WebP, 5MB 이하)을 변경한다. 저장 전에는 사진 미리보기만 표시하며 취소하면 입력을 버린다. 저장 후 프로필 캐시를 갱신하며 공개 표시의 기준은 Auth의 가입 당시 displayName이 아닌 profiles 문서다. 거래 및 리뷰 집계는 추후 구현한다.

사진은 본인 경로에 새 파일로 업로드한다. 저장 실패 시 새 파일, 교체 성공 시 이전 파일 정리를 시도하며 현재 프로필에서 사용 중인 파일은 삭제·덮어쓰기할 수 없다. 네트워크 오류 등으로 정리하지 못한 파일은 탈퇴 시 프로필 경로와 함께 정리한다.

## 검증과 배포

```sh
npm run check
npm run build
node --test tests/unit/*.test.mjs
npx firebase emulators:exec --config firebase.e2e.json --project demo-collezio --only auth,firestore,storage,functions "node --test tests/integration/profiles.rules.test.mjs functions/tests/profile-nickname.test.mjs"
npm run test:e2e
npx firebase deploy --project collezio-e3a8d --only firestore:rules,storage,functions
```

실제 서비스에서 기능을 사용하려면 `checkNickname`, `saveProfile`, 탈퇴 Functions와 Firestore 규칙 배포가 필요하다. 신규 Functions를 먼저 배포한 뒤 새 클라이언트와 직접 쓰기 차단 규칙을 함께 반영해야 한다. 구버전 클라이언트의 직접 쓰기는 규칙 배포 후 거부되므로 새로고침해야 한다. 테스트는 Auth·Firestore·Storage·Functions 에뮬레이터를 사용한다.
