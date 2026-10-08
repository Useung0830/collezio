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

신규 가입 시 프로필 생성을 시도한다. 계정은 생성됐지만 프로필 저장이 실패한 경우 가입을 다시 요구하지 않고 본인 프로필 조회 때 복구한다. 기존 계정은 본인 프로필 조회 또는 상품 등록 시 문서가 없으면 생성한다. 트랜잭션으로 기존 문서를 덮어쓰지 않는다.

아직 방문하지 않은 기존 판매자는 프로필이 없을 수 있다. 다른 사용자의 프로필을 Auth 정보로 임의 생성하지 않으며 프로필 미등록 상태를 표시한다.

## 권한과 범위

`firestore.rules`는 공개 단건 조회와 본인 문서 생성 및 닉네임·사진 수정을 허용한다. 목록 조회, 클라이언트 삭제, 집계·생성일·자기소개 변경과 임의 필드 추가는 허용하지 않는다. 탈퇴 처리 중인 계정은 수정·업로드할 수 없다.

마이페이지 상단의 수정 버튼에서 닉네임(앞뒤 공백 제거 후 2~10자)과 사진(JPG·PNG·WebP, 5MB 이하)을 변경한다. 저장 전에는 사진 미리보기만 표시하며 취소하면 입력을 버린다. 저장 후 프로필 캐시를 갱신하며 공개 표시의 기준은 Auth의 가입 당시 displayName이 아닌 profiles 문서다. 거래 및 리뷰 집계는 추후 구현한다.

사진은 본인 경로에 새 파일로 업로드한다. 저장 실패 시 새 파일, 교체 성공 시 이전 파일 정리를 시도하며 현재 프로필에서 사용 중인 파일은 삭제·덮어쓰기할 수 없다. 네트워크 오류 등으로 정리하지 못한 파일은 탈퇴 시 프로필 경로와 함께 정리한다.

## 검증과 배포

```sh
npm run check
npm run build
node --test tests/unit/*.test.mjs
npx firebase emulators:exec --config firebase.e2e.json --project demo-collezio --only auth,firestore "node --test tests/integration/profiles.rules.test.mjs"
npm run test:e2e
npx firebase deploy --project collezio-e3a8d --only firestore:rules,storage,functions
```

실제 서비스에서 기능을 사용하려면 Firestore·Storage 규칙과 프로필 이미지 탈퇴 정리를 포함한 Functions 배포가 필요하다. 사진 수정 테스트는 Auth·Firestore·Storage 에뮬레이터를 사용한다.
