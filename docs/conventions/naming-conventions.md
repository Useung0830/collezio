# 네이밍 컨벤션

## 기본 원칙

- 이름만 보고 변수, 함수, 컴포넌트의 역할을 파악할 수 있도록 작성합니다.
- 의미가 불분명한 축약어 사용은 지양합니다.
- 일반적으로 사용되는 약어(`id`, `url`, `api` 등)는 허용합니다.

## 변수

- 변수명은 `camelCase`를 사용합니다.
- 배열은 가능한 경우 복수형을 사용합니다.
- `List`, `Array`처럼 자료구조 자체를 이름에 넣는 것은 지양합니다.

예시:

```tsx
const userName = "홍길동";
const productPrice = 10000;

const users = [];
const products = [];
const selectedItems = [];
```

## Boolean

Boolean 값은 상태를 명확하게 표현하도록 다음 접두사를 사용합니다.

- `is`: 상태 여부
- `has`: 보유 여부
- `can`: 가능 여부
- `should`: 실행 필요 여부

예시:

```tsx
const isLoggedIn = true;
const isModalOpen = false;
const hasPermission = true;
const canEdit = true;
const shouldRefetch = false;
```

## 함수

- 함수명은 `camelCase`를 사용합니다.
- 기본적으로 `동사 + 목적어` 형태로 작성합니다.

예시:

```tsx
getUser();
createProduct();
updateProfile();
deleteComment();

formatPrice();
validateEmail();
calculateTotalPrice();
```

## API 함수

- 데이터 조회는 `get`을 사용합니다.
- 데이터 생성은 `create`를 사용합니다.
- 데이터 수정은 `update`를 사용합니다.
- 데이터 삭제는 `delete`를 사용합니다.

예시:

```tsx
getUserName();
getSelectedProduct();
getProducts();
createProduct();
updateProduct();
deleteProduct();
```

## 이벤트 함수

컴포넌트 내부 이벤트 처리 함수는 `handle`을 사용합니다.

컴포넌트 내부 이벤트 처리 함수는 화살표 함수로 작성합니다.

```tsx
const handleClick = () => {};
const handleSubmit = () => {};
const handleDelete = () => {};
```

Props로 전달하는 이벤트는 `on`을 사용합니다.

```tsx
<ProductCard onSelect={handleSelect} />
<Button onClick={handleClick} />
```

## 컴포넌트

React 컴포넌트는 `PascalCase`를 사용합니다.

```text
ProductCard
ProductList
LoginForm
TradeRequestModal
```

## Type / Interface

TypeScript의 Type과 Interface는 `PascalCase`를 사용합니다.

```tsx
type User = {};
type Product = {};
type TradeStatus = {};
```

Props 타입은 `컴포넌트명 + Props` 형식을 사용합니다.

```tsx
type ProductCardProps = {};
type LoginFormProps = {};
```

`IUser`, `IProduct`처럼 `I` 접두사는 사용하지 않습니다.

## 상수

애플리케이션 전역에서 사용하는 상수는 `UPPER_SNAKE_CASE`를 사용합니다.

```tsx
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const DEFAULT_PAGE_SIZE = 20;
const API_TIMEOUT = 5000;
```

일반적인 지역 변수는 `camelCase`를 사용합니다.
