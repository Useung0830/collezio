# 함수 컨벤션

## 하나의 책임

함수는 하나의 명확한 역할을 담당하도록 작성합니다.

```tsx
validateProduct();
uploadProductImage();
createProduct();
```

하나의 함수 안에서 검증, 데이터 가공, API 요청, UI 처리까지 지나치게 많은 역할을 수행하지 않습니다.

## Early Return

조건문 중첩을 줄일 수 있다면 Early Return을 우선합니다.

```tsx
function getUserName(user?: User) {
  if (!user) {
    return null;
  }

  if (!user.name) {
    return "이름 없음";
  }

  return user.name;
}
```

깊은 중첩은 지양합니다.

```tsx
// 지양
if (user) {
  if (user.name) {
    if (user.isActive) {
      // ...
    }
  }
}
```

## 매개변수

매개변수가 많아지면 객체 형태 사용을 고려합니다.

```tsx
// 지양
createProduct(name, price, category, description, image);

// 권장
createProduct({
  name,
  price,
  category,
  description,
  image,
});
```

## 매직 넘버

의미를 알기 어려운 숫자와 문자열을 직접 반복해서 사용하지 않습니다.

```tsx
// 지양
if (file.size > 5242880) {
}

// 권장
const MAX_FILE_SIZE = 5 * 1024 * 1024;

if (file.size > MAX_FILE_SIZE) {
}
```

## 중복 코드

동일한 로직이 여러 위치에서 반복되고 하나의 역할로 정의할 수 있다면 함수로 분리합니다.

```tsx
const formattedPrice = formatPrice(product.price);
```

단, 한 번만 사용하는 매우 단순한 코드까지 무조건 함수로 분리하지 않습니다.

## 주석

코드가 무엇을 하는지 설명하는 주석은 지양합니다.

```tsx
// 지양
// 상품을 가져온다.
const product = getProduct();
```

코드만으로 알기 어려운 이유나 의도를 설명합니다.
