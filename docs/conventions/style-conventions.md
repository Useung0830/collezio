# 스타일 컨벤션

코드 포맷 관련 규칙은 사람이 직접 맞추기보다 ESLint와 Prettier를 이용해 자동화합니다.

자동화 가능한 규칙은 개인 판단으로 파일마다 다르게 작성하지 않습니다.

- ESLint는 코드 오류와 품질을 검사합니다.
- Prettier는 코드 형식을 자동으로 정리합니다.

## Formatting

다음 항목은 Prettier 설정을 따릅니다.

- 들여쓰기
- 줄바꿈
- 세미콜론
- 따옴표
- Trailing Comma
- JSX Formatting

Prettier는 다음 설정을 사용합니다.

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 80,
  "arrowParens": "always",
  "bracketSameLine": false,
  "endOfLine": "lf"
}
```

## const 우선

재할당이 필요하지 않은 변수는 `const`를 사용합니다.

```tsx
const product = getProduct();
```

재할당이 필요한 경우에만 `let`을 사용합니다.

`var`는 사용하지 않습니다.

## 조건식

불필요한 Boolean 비교를 하지 않습니다.

```tsx
// 지양
if (isLoggedIn === true) {
}

// 권장
if (isLoggedIn) {
}
```

반대 조건은 `!`를 사용합니다.

```tsx
if (!isLoggedIn) {
}
```

## 불필요한 코드

사용하지 않는 코드는 제거합니다.

- 사용하지 않는 변수
- 사용하지 않는 import
- 주석 처리된 이전 코드
- 디버깅용 `console.log`
- 임시 테스트 코드

이전 코드는 Git History에서 확인할 수 있으므로 주석으로 장기간 보관하지 않습니다.

## 스타일링

동일한 역할의 UI는 가능한 한 동일한 스타일 규칙을 사용합니다.

반복적으로 사용하는 UI는 공통 컴포넌트 분리를 고려합니다.

예시:

- Button
- Input
- Modal
- Badge
- Card

Tailwind CSS를 사용하는 경우 동일한 역할의 컴포넌트에서 클래스 작성 방식이 크게 달라지지 않도록 유지합니다.

## 타이포그래피와 기본 글자 색상

- UI의 글자 스타일은 반드시 `src/styles/typography.css`에 정의된 클래스를 사용합니다.
- `text-[숫자]`, `font-[숫자]` 등 임의의 Tailwind 글자 크기와 굵기를 직접 추가하지 않습니다.
- 필요한 글자 스타일이 없다면 컴포넌트에서 임시로 만들지 않고 `typography.css`에 재사용 가능한 클래스로 먼저 정의합니다.
- 별도의 의미 색상이나 비활성 상태가 지정되지 않은 글자는 `text-black-900`을 기본으로 사용합니다.
- 보조 설명, 비활성 상태, 오류, 브랜드 색상은 디자인에 명시된 경우에만 다른 색상을 사용합니다.

## 접근성

사용자가 조작하는 요소는 의미에 맞는 HTML 요소를 사용합니다.

```tsx
// 지양
<div onClick={handleClick}>등록</div>

// 권장
<button onClick={handleClick}>
  등록
</button>
```

이미지에는 의미에 맞는 `alt`를 작성합니다.

```tsx
<img src={product.image} alt={`${product.name} 상품 이미지`} />
```

장식용 이미지는 빈 `alt`를 사용할 수 있습니다.
