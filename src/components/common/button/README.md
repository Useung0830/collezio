# 공통 버튼

| 컴포넌트       | 역할                          | 필수 속성    |
| -------------- | ----------------------------- | ------------ |
| `Button`       | 작업 실행, 폼 제출            | —            |
| `LinkButton`   | Next.js Link를 통한 화면 이동 | `href`       |
| `IconButton`   | 닫기 등 아이콘 동작           | `aria-label` |
| `ToggleButton` | 찜 등 켜기·끄기               | `isPressed`  |

`Button`, `LinkButton`은 `variant="primary | outline | ghost | blue | green | muted"`를 지원합니다.
`ToggleButton`은 선택 여부에 따라 primary 또는 outline을 사용합니다.
텍스트 버튼 크기는 `size="xs | compact | sm | md | lg | text"`이며 기본값은 md입니다.
IconButton 크기는 `size="sm | md"`입니다.
텍스트 버튼 모양은 `shape="pill | rounded | square"`이며 기본값은 pill입니다.
square는 기존 GNB의 rounded-lg, rounded는 폼의 rounded-2xl, pill은 rounded-full입니다.
글자 스타일은 기존 typography.css의 label 클래스를 사용합니다.
`className`은 너비·여백 등 배치에 사용하고, 색상·크기는 전용 속성으로 지정합니다.
클래스 충돌을 자동으로 병합하지 않습니다.

```tsx
import Button from "@/components/common/button/Button";
import IconButton from "@/components/common/button/IconButton";
import LinkButton from "@/components/common/button/LinkButton";
import ToggleButton from "@/components/common/button/ToggleButton";

<Button onClick={handleAccept}>수락하기</Button>
<Button type="submit" variant="primary" isLoading={isSubmitting}>
  작성완료
</Button>
<LinkButton href="/products/new">상품등록</LinkButton>
<IconButton aria-label="닫기" onClick={handleClose}>
  <CloseIcon />
</IconButton>
<ToggleButton isPressed={isFavorite} onClick={handleToggleFavorite}>
  찜
</ToggleButton>
```

- `Button`의 기본 type은 button이며 폼 제출에만 submit을 지정합니다.
- `Button`, `ToggleButton`은 isLoading일 때 스피너와 aria-busy를 표시하고 비활성화합니다. 기존 버튼 문구는 유지합니다.
- API 요청, 제출 및 선택 상태, 확인 모달은 feature 또는 호출하는 화면에서 관리합니다.
- 이벤트 핸들러와 상태를 사용하는 호출부는 Client Component에 둡니다.
- 네이티브 속성과 ref를 전달할 수 있습니다. LinkButton은 Link 속성을 전달합니다.
- IconButton은 아이콘을 장식 요소로 숨기고 필수 aria-label로 동작을 설명합니다.
- ToggleButton은 aria-pressed를 제공하며, 선택 전후에도 같은 이름을 사용합니다.
- 택배거래·직거래처럼 하나만 고르는 입력은 라디오 그룹으로 구현합니다.
- LinkButton에는 disabled나 로딩 속성이 없습니다. 이동 불가 상태의 표현은 화면에서 결정합니다.

## 화면 적용

| 화면                          | 적용                                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| 데스크톱·모바일 GNB           | 로그인·회원가입 LinkButton, 모바일 닫기 IconButton                                             |
| 로그인·비밀번호 찾기·회원가입 | Button, 실제 회원가입 isSubmitting 연동                                                        |
| 상품 등록                     | RadioOption으로 거래 종류·거래 방식 선택, 무료 배송 ToggleButton, 등록 Button, 닫기 IconButton |
| 상품 상세                     | 찜 ToggleButton, 판매 요청·교환 선택 진입 Button                                               |
| 매칭                          | 상품 등록 LinkButton, MatchActionButton 내부에서 공통 Button 사용                              |
| 프로필                        | 수정 모달 진입 Button                                                                          |
| 커뮤니티                      | 글쓰기 LinkButton, 작성 완료 Button, 닫기 IconButton                                           |
| 회원 메뉴                     | 로그아웃·탈퇴 진입 및 확인 Button                                                              |

RadioOption은 기존 fieldset·legend 안에서 같은 name으로 묶습니다. 네이티브 radio가 단일 선택과 방향키 조작을 담당합니다.

현재 프로필 수정 모달, 매칭 수락·거절·제안취소·추천 상세·닫기, 상품 상세 찜·판매·교환의 핸들러는 연결되어 있지 않습니다.
상품 상세 찜의 isPressed=false는 기존 미연결 UI의 초기 표시입니다. 실제 찜 상태와 요청 로직은 feature에서 연결해야 합니다.
로그인 및 상품 등록도 실제 요청이 없는 기존 UI입니다. 상품 등록의 제출은 API 연결 전까지 기본 페이지 이동을 방지합니다.
매칭 추천 상세에는 대상 상품 ID·경로가 없어 LinkButton의 href를 임의로 만들지 않았습니다.
