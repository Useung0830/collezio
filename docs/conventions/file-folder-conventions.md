# 파일 및 폴더 컨벤션

## 기본 원칙

- 파일과 폴더 이름만 보고 역할을 파악할 수 있도록 작성합니다.
- 같은 역할을 가진 파일은 동일한 명명 규칙을 사용합니다.

## React Component

컴포넌트 파일은 `PascalCase`를 사용합니다.

```text
ProductCard.tsx
ProductList.tsx
LoginForm.tsx
TradeModal.tsx
```

파일명과 컴포넌트명을 동일하게 작성합니다.

## Custom Hook

Custom Hook은 `use`로 시작하며 `camelCase`를 사용합니다.

```text
useAuth.ts
useProducts.ts
useModal.ts
useInfiniteProducts.ts
```

## Utility

Utility 함수 파일은 `camelCase`를 사용합니다.

```text
formatPrice.ts
formatDate.ts
calculateTotalPrice.ts
validateEmail.ts
```

가능하면 하나의 파일은 하나의 주요 역할을 담당합니다.

## Store

전역 상태 Store는 `기능명 + Store.ts` 형식을 사용합니다.

```text
authStore.ts
tradeStore.ts
modalStore.ts
```

## 타입 파일

도메인 타입 파일은 `camelCase`를 사용합니다.

```text
user.ts
product.ts
trade.ts
common.ts
```

## Next.js 특수 파일

Next.js가 지정한 파일명은 프레임워크 규칙을 그대로 사용합니다.

```text
page.tsx
layout.tsx
loading.tsx
error.tsx
not-found.tsx
route.ts
proxy.ts
```

## 폴더

폴더는 기본적으로 소문자를 사용합니다.

```text
components/
hooks/
utils/
types/
stores/
services/
```

여러 단어가 필요한 경우 `kebab-case`를 사용합니다.

```text
product-detail/
trade-request/
user-profile/
```

## Import 경로

깊은 상대경로보다 `@` alias를 우선 사용합니다.

```tsx
// 지양
import Button from "../../../components/button/Button";

// 권장
import Button from "@/components/button/Button";
```

같은 폴더의 가까운 파일은 상대경로 사용을 허용합니다.

```tsx
import ProductImage from "./ProductImage";
```

## Import 순서

다음 순서를 기본으로 합니다.

1. 외부 라이브러리
2. 내부 컴포넌트 및 Feature
3. Hooks
4. Store / Service / API / Query
5. Utils / Constants
6. Types
7. Assets / Styles
8. 현재 디렉터리 파일

각 그룹 사이는 빈 줄로 구분합니다.

같은 그룹 안에서는 가까운 코드끼리 배치하며, 모든 Import를 알파벳순으로 정렬하지 않아도 됩니다.

예시:

```tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import Button from "@/components/button/Button";

import { useAuth } from "@/hooks/useAuth";

import { useAuthStore } from "@/stores/authStore";
import { getProducts } from "@/features/product/api/getProducts";

import { formatPrice } from "@/utils/formatPrice";
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";

import type { Product } from "@/types/product";

import productPlaceholder from "@/assets/images/product-placeholder.webp";
import "@/app/globals.css";

import ProductImage from "./ProductImage";
```

## 이미지 파일

이미지 파일은 영문 소문자 `kebab-case`를 사용합니다.

```text
login-banner.png
profile-default.png
product-placeholder.webp
main-hero-image.webp
```

반응형 이미지도 `kebab-case`를 사용합니다.

```text
main-banner-mobile.webp
main-banner-tablet.webp
main-banner-desktop.webp
```

다음 형식은 사용하지 않습니다.

```text
login_banner.png
mainHeroImage.png
로그인배너.png
login banner.png
```

## 환경변수

- 환경에 따라 달라지는 값은 `.env` 파일을 통해 관리합니다.
- API Key, Secret 등 민감한 값은 코드에 직접 작성하지 않습니다.
- `.env` 파일은 Git에 Commit하지 않습니다.
- 클라이언트에 노출되어도 되는 환경변수만 `NEXT_PUBLIC_` 접두사를 사용합니다.
- 필요한 환경변수 목록은 `.env.example`에 작성합니다.
