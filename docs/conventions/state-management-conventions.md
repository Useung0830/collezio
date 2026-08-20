## 상태 관리 기준

상태의 종류에 따라 관리 방법을 구분합니다.

- 컴포넌트 내부 상태 → `useState`
- 여러 컴포넌트가 공유하는 Client State → `Zustand`
- 서버 데이터 → `TanStack Query`
- URL로 표현할 수 있는 상태 → `params`, `searchParams`

## Local State

하나의 컴포넌트 또는 가까운 컴포넌트에서만 사용하는 상태는 `useState`를 사용합니다.

```tsx
const [isModalOpen, setIsModalOpen] = useState(false);
```

다음과 같은 UI 상태는 불필요하게 전역 Store에 저장하지 않습니다.

- 모달 열림 여부
- Dropdown 상태
- Accordion 상태
- 현재 입력값
- 임시 선택 상태

## Global Client State

여러 페이지 또는 여러 영역에서 공유해야 하는 Client State는 Zustand 사용을 고려합니다.

예시:

- 사용자 인증 관련 클라이언트 상태
- 여러 페이지에서 공유되는 선택 정보
- 애플리케이션 전역 UI 상태

서버에서 가져온 데이터를 단순히 공유하기 위한 목적으로 Zustand에 중복 저장하지 않습니다.

## Server State

API에서 가져오는 서버 데이터는 TanStack Query를 사용합니다.

예시:

- 상품 목록
- 상품 상세
- 게시물
- 댓글
- 사용자 정보

다음과 같은 서버 데이터 관련 상태도 TanStack Query에서 관리합니다.

- Fetching
- Caching
- Refetch
- Loading
- Error
- Mutation

## URL State

새로고침하거나 URL을 공유했을 때 유지되어야 하는 상태는 URL 사용을 우선 고려합니다.

예시:

- 검색어
- 페이지 번호
- 카테고리
- 정렬 방식
- 필터

```
/products?category=figure&page=2&sort=latest
```

## Derived State

다른 값으로 계산할 수 있는 값은 별도의 State로 저장하지 않습니다.
