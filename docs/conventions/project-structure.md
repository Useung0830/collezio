# 프로젝트 파일 구조 컨벤션

> 상태: 임시안  
> 이 문서는 현재 구현 상태가 아니라, 프로젝트가 지향하는 목표 구조를 정의한다. 기능이 추가될 때 필요한 디렉터리와 파일만 생성하며 빈 폴더를 미리 만들지 않는다.

## 기본 원칙

- `src/app`은 URL 라우팅, 레이아웃, 페이지 조립을 담당한다.
- 비즈니스 기능은 도메인 단위로 `src/features`에 모은다.
- 여러 도메인에서 함께 사용하는 UI는 `src/components`에 둔다.
- 프레임워크 및 외부 라이브러리 설정은 `src/lib`에 둔다.
- 전역 훅, 상수, 타입, 순수 유틸리티는 각각의 공용 디렉터리에 둔다.
- 특정 기능에서만 쓰는 코드는 공용 디렉터리로 올리지 않고 해당 `feature` 내부에 둔다.
- `page.tsx`는 가능한 한 얇게 유지하고, 화면 구성과 데이터 연결은 feature 컴포넌트에 위임한다.

## 목표 디렉터리 구조

```text
src/
├── app/                         # App Router: 라우트와 화면 조립
│   ├── layout.tsx               # 전체 애플리케이션 루트 레이아웃
│   ├── providers.tsx            # 전역 Client Provider 조합
│   ├── page.tsx                 # 홈 (/)
│   ├── loading.tsx              # 루트 로딩 UI
│   ├── error.tsx                # 루트 에러 UI
│   ├── not-found.tsx            # 404 UI
│   ├── globals.css              # 전역 스타일
│   ├── (auth)/                  # 인증 화면 라우트 그룹 (URL에는 미포함)
│   │   ├── login/page.tsx       # 로그인 (/login)
│   │   ├── signup/page.tsx      # 회원가입 (/signup)
│   │   └── find-password/page.tsx # 비밀번호 찾기 (/find-password)
│   ├── products/
│   │   ├── [productId]/page.tsx # 상품 상세 (/products/:productId)
│   │   └── new/page.tsx         # 상품 등록 (/products/new)
│   ├── community/
│   │   ├── page.tsx             # 커뮤니티 목록 (/community)
│   │   ├── [postId]/page.tsx    # 게시글 상세 (/community/:postId)
│   │   └── new/page.tsx         # 게시글 작성 (/community/new)
│   ├── chat/
│   │   ├── page.tsx             # 채팅방 목록 (/chat)
│   │   └── [chatRoomId]/page.tsx# 채팅방 (/chat/:chatRoomId)
│   └── my/
│       ├── layout.tsx           # 마이페이지 공통 레이아웃
│       ├── page.tsx             # 마이페이지 홈 (/my)
│       ├── collections/page.tsx # 보유 컬렉션
│       ├── matches/page.tsx     # 매칭 내역
│       ├── favorites/page.tsx   # 관심 상품
│       ├── reviews/page.tsx     # 리뷰 내역
│       └── posts/page.tsx       # 작성 게시글
│
├── features/                    # 도메인별 기능 모듈
│   ├── auth/
│   ├── product/
│   ├── matching/
│   ├── favorite/
│   ├── review/
│   ├── community/
│   ├── chat/
│   └── user/
│
├── components/
│   ├── common/                  # 도메인에 종속되지 않는 공용 UI
│   │   ├── button/Button.tsx
│   │   ├── input/Input.tsx
│   │   ├── textarea/Textarea.tsx
│   │   ├── modal/Modal.tsx
│   │   ├── avatar/Avatar.tsx
│   │   ├── badge/Badge.tsx
│   │   ├── dropdown/Dropdown.tsx
│   │   ├── pagination/Pagination.tsx
│   │   ├── spinner/Spinner.tsx
│   │   └── empty-state/EmptyState.tsx
│   └── layout/                  # 전역 레이아웃 UI
│       ├── header/
│       │   ├── Header.tsx
│       │   ├── Gnb.tsx
│       │   ├── GnbItem.tsx
│       │   └── UserMenu.tsx
│       ├── my-sidebar/
│       │   ├── MySidebar.tsx
│       │   └── MySidebarItem.tsx
│       └── footer/Footer.tsx
│
├── lib/                         # 외부 시스템 및 라이브러리 기반 설정
│   ├── api/
│   │   ├── client.ts            # 브라우저용 API 클라이언트
│   │   ├── serverClient.ts      # 서버용 API 클라이언트
│   │   └── error.ts             # 공통 API 에러 처리
│   └── query/
│       ├── queryClient.ts       # 클라이언트 QueryClient 설정
│       └── getQueryClient.ts    # 서버 QueryClient 생성/조회
│
├── hooks/                       # 둘 이상의 도메인에서 쓰는 공용 훅
├── constants/                   # 전역 상수
├── types/                       # 전역 공유 타입
├── utils/                       # 도메인 독립적인 순수 함수
└── assets/
    ├── icons/                   # 아이콘 원본
    └── images/                  # 이미지 원본
```

## `features` 내부 구조

각 feature는 필요한 폴더만 선택해서 사용한다.

```text
features/{domain}/
├── api/         # HTTP 요청 함수
├── components/  # 해당 도메인에서만 사용하는 UI
├── hooks/       # Query/Mutation 및 도메인 훅
├── queries/     # Query Key 팩토리와 쿼리 옵션
├── schemas/     # 폼 및 API 데이터 검증 스키마
├── types/       # 해당 도메인 타입
└── utils/       # 해당 도메인 전용 순수 함수
```

예를 들어 상품 기능은 다음과 같이 구성한다.

```text
features/product/
├── api/
│   ├── getProducts.ts
│   ├── getProduct.ts
│   ├── createProduct.ts
│   ├── updateProduct.ts
│   └── deleteProduct.ts
├── components/
│   ├── ProductCard.tsx
│   ├── ProductList.tsx
│   ├── ProductDetail.tsx
│   ├── ProductForm.tsx
│   ├── ProductImage.tsx
│   └── ProductStatusBadge.tsx
├── hooks/
│   ├── useProductsQuery.ts
│   ├── useProductQuery.ts
│   ├── useCreateProductMutation.ts
│   ├── useUpdateProductMutation.ts
│   └── useDeleteProductMutation.ts
├── queries/productQueryKeys.ts
├── schemas/productSchema.ts
├── types/product.ts
└── utils/formatProduct.ts
```

## 파일 배치 기준

### `app`과 `features`

- URL과 직접 대응하면 `app`에 둔다.
- 페이지 전용 메타데이터, 로딩, 에러 처리는 해당 route segment에 둔다.
- 데이터 요청, 상태 처리, 폼 로직, 도메인 UI는 `features`에 둔다.
- `app/**/page.tsx`에서 API 호출 세부 구현을 직접 작성하지 않는다.
- 동적 segment 이름은 의미가 드러나도록 `[id]` 대신 `[productId]`, `[postId]`처럼 작성한다.

### 공용 코드와 feature 코드

- 한 feature에서만 사용하면 해당 feature 내부에 둔다.
- 둘 이상의 feature에서 실제로 재사용될 때 공용 디렉터리로 이동한다.
- `components/common`에는 Button, Modal처럼 도메인 지식이 없는 UI만 둔다.
- ProductCard처럼 도메인 이름과 규칙을 포함하는 UI는 `features/product/components`에 둔다.
- 범용 React 훅은 `src/hooks`, 도메인 훅은 `features/{domain}/hooks`에 둔다.
- 전역 타입은 `src/types`, 도메인 타입은 `features/{domain}/types`에 둔다.

### `lib`과 `utils`

- API 클라이언트나 TanStack Query처럼 외부 라이브러리에 결합된 코드는 `lib`에 둔다.
- 입력과 출력만으로 동작하는 범용 순수 함수는 `utils`에 둔다.
- 특정 도메인의 값과 규칙을 아는 함수는 feature의 `utils`에 둔다.

### 에셋

- 모듈에서 import하여 번들링할 에셋은 `src/assets`에 둔다.
- URL로 직접 제공해야 하는 정적 파일은 프로젝트 루트의 `public` 사용을 검토한다.
- 파일 이름은 소문자 kebab-case를 기본으로 통일한다.
- 같은 의미의 에셋에 `icon_heart.svg`, `Icon_notification.svg`처럼 대소문자 규칙을 혼용하지 않는다.

## 네이밍 규칙

| 대상           | 규칙                 | 예시                             |
| -------------- | -------------------- | -------------------------------- |
| React 컴포넌트 | PascalCase           | `ProductCard.tsx`                |
| React 훅       | `use` + PascalCase   | `useProductQuery.ts`             |
| API 함수       | 동사 + 대상          | `getProduct.ts`, `createPost.ts` |
| Query Key      | 도메인 + `QueryKeys` | `productQueryKeys.ts`            |
| 스키마         | 대상 + `Schema`      | `productSchema.ts`               |
| 일반 TS 파일   | camelCase            | `formatPrice.ts`                 |
| 라우트 폴더    | 소문자 kebab-case    | `community`, `my-page`           |
| 동적 라우트    | camelCase 식별자     | `[productId]`                    |
| 에셋 파일      | 소문자 kebab-case    | `icon-arrow-right.svg`           |

## 의존성 방향

권장 의존성 흐름은 다음과 같다.

```text
app
├── features
│   ├── components/common
│   ├── hooks, constants, types, utils
│   └── lib
└── components/layout
    ├── components/common
    └── hooks, constants, types, utils
```

- `app`은 feature와 공용 모듈을 가져올 수 있다.
- feature는 공용 모듈을 가져올 수 있다.
- 공용 모듈은 특정 feature를 가져오지 않는다.
- feature 간 직접 참조는 최소화한다. 공통 개념이 생기면 공유 경계를 별도로 정의한다.
- 순환 참조가 생기지 않도록 하위 계층에서 `app`을 import하지 않는다.

## Next.js App Router 규칙

- 루트 `app/layout.tsx`는 필수이며 `html`, `body`를 포함한다.
- 폴더는 URL segment를 정의하고, `page.tsx` 또는 `route.ts`가 있을 때 공개 route가 된다.
- `layout.tsx`는 같은 segment와 하위 route가 공유하는 UI에 사용한다.
- `loading.tsx`, `error.tsx`, `not-found.tsx`는 필요한 범위의 segment에 가깝게 둔다.
- URL에는 나타나지 않는 route 분류가 필요하면 `(groupName)` 형태의 route group을 사용한다.
- 현재 설치된 Next.js의 API가 일반적으로 알려진 버전과 다를 수 있으므로, Next.js 코드를 작성하기 전에 `node_modules/next/dist/docs`의 관련 문서를 먼저 확인한다.

## 새 기능 추가 체크리스트

1. URL이 필요하면 `app`에 route segment와 `page.tsx`를 추가한다.
2. 도메인이 새로 생기면 `features/{domain}`을 추가한다.
3. 필요한 `api`, `components`, `hooks`, `queries`, `schemas`, `types`, `utils`만 만든다.
4. 페이지는 feature 컴포넌트를 조립하는 역할에 집중한다.
5. 두 곳 이상에서 재사용되는 것이 확인된 코드만 공용 디렉터리로 이동한다.
6. 파일명과 import 방향이 이 문서의 규칙을 따르는지 확인한다.
