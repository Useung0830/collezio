# React 컨벤션

## 컴포넌트 내부 순서

컴포넌트 내부에서는 다음 순서를 기본으로 합니다.

1. Hooks
2. State
3. Derived Values
4. Event Handlers
5. Effects
6. JSX

예시:

```tsx
function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);

  const formattedPrice = formatPrice(product.price);

  const handleClick = () => {
    router.push(`/products/${product.id}`);
  };

  return (
    <article onClick={handleClick}>
      <h2>{product.name}</h2>
      <span>{formattedPrice}</span>
    </article>
  );
}
```

## 컴포넌트 분리 기준

### 파일 분리 원칙

- 독립적으로 이름을 가진 React 컴포넌트는 별도 파일에 작성합니다.
- 한 파일 안에 여러 React 컴포넌트를 함께 선언하지 않습니다.
- 컴포넌트 파일명과 컴포넌트명은 동일하게 작성합니다.
- 부모 컴포넌트는 분리된 자식 컴포넌트를 import하여 조립합니다.
- Next.js가 지정한 `page.tsx`, `layout.tsx` 등의 특수 파일명은 예외로 합니다.

예시:

```text
ProductForm.tsx
SelectionButton.tsx
ProductImageList.tsx
```

다음과 같은 경우 컴포넌트 분리를 고려합니다.

- 여러 화면에서 반복해서 사용하는 UI
- 독립적인 의미를 가진 UI
- 자체적인 상태 또는 이벤트 로직을 가진 UI
- 부모 컴포넌트의 가독성을 크게 떨어뜨리는 UI

예시:

```text
ProductDetail
├── ProductGallery
├── ProductInfo
├── SellerProfile
└── TradeAction
```

컴포넌트 함수 본문이 100줄을 넘어간다면 컴포넌트 분리를 고민합니다.

## Props

Props는 필요한 값만 전달합니다.

도메인 객체 자체를 표현하는 컴포넌트에는 객체 전체 전달을 허용합니다.

```tsx
<ProductCard product={product} />
```

공용 컴포넌트와 객체의 일부 값만 사용하는 컴포넌트에는 필요한 값만 전달합니다.

```tsx
<Avatar imageUrl={user.profileImage} alt={user.nickname} />
```

## Props Drilling

1~2단계 정도의 Props 전달은 허용합니다.

단순히 Props 전달을 피하기 위해 모든 상태를 전역 상태로 만들지 않습니다.

여러 단계에서 동일한 상태가 반복적으로 필요하다면 상태 구조 변경을 고려합니다.

## 조건부 렌더링

단순한 조건은 JSX 내부에서 처리합니다.

```tsx
{
  isLoggedIn && <Profile />;
}
```

조건이 복잡하다면 별도의 변수로 분리합니다.

```tsx
const isTradeAvailable =
  product.status === "available" && product.userId !== currentUser.id;
```

## Key

목록 렌더링에서는 고유하고 안정적인 값을 `key`로 사용합니다.

```tsx
products.map((product) => <ProductCard key={product.id} product={product} />);
```

가능한 경우 배열 index를 `key`로 사용하지 않습니다.

## useEffect

`useEffect`는 외부 시스템과 React 상태를 동기화해야 할 때 사용합니다.

단순 계산을 위해 별도의 State와 `useEffect`를 만들지 않습니다.
