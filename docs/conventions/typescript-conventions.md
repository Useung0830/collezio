# TypeScript 컨벤션

## any 사용 지양

`any`는 가능한 한 사용하지 않습니다.

```tsx
// 지양
function handleProduct(product: any) {}

// 권장
function handleProduct(product: Product) {}
```

외부 데이터처럼 타입을 확신할 수 없는 경우 `unknown`을 우선 사용합니다.

```tsx
function handleError(error: unknown) {}
```

## 타입 추론 활용

TypeScript가 명확하게 타입을 추론할 수 있다면 불필요한 타입 선언은 생략합니다.

```tsx
// 지양
const name: string = "홍길동";
const count: number = 0;

// 권장
const name = "홍길동";
const count = 0;
```

타입 정보가 필요한 경우에는 명시합니다.

```tsx
const [product, setProduct] = useState<Product | null>(null);
```

## Props 타입

Props는 별도의 타입으로 정의합니다.

```tsx
type ProductCardProps = {
  product: Product;
  onSelect: (id: number) => void;
};

function ProductCard({ product, onSelect }: ProductCardProps) {
  // ...
}
```

## 상태값 타입

제한된 문자열 값은 `string`보다 Union Type을 사용합니다.

```tsx
type TradeStatus = "pending" | "accepted" | "rejected" | "completed";
```

## Optional 값

값이 존재하지 않을 수 있다면 타입에 명확하게 표현합니다.

```tsx
type User = {
  id: number;
  nickname: string;
  profileImage?: string;
};
```

`null`이 실제 상태를 의미한다면 명시적으로 포함합니다.

```tsx
type SelectedUser = User | null;
```

## 타입 단언

`as`를 사용한 강제 타입 단언은 최소화합니다.

```tsx
// 지양
const user = data as User;
```

외부 API 데이터는 가능하면 검증 후 사용합니다.

## 공통 타입

여러 영역에서 공통으로 사용하는 타입은 별도 파일로 분리합니다.

```text
types/
├── user.ts
├── product.ts
├── trade.ts
└── common.ts
```

단순히 한 파일에서만 사용하는 타입은 가까운 위치에 선언할 수 있습니다.
