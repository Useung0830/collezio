type KakaoPostcodeResult = {
  address: string;
};

type KakaoPostcodeOptions = {
  oncomplete: (data: KakaoPostcodeResult) => void;
  width?: string | number;
  height?: string | number;
};

declare global {
  interface Window {
    kakao?: {
      Postcode: new (options: KakaoPostcodeOptions) => {
        embed: (
          element: HTMLElement,
          options?: { autoClose?: boolean },
        ) => void;
      };
    };
  }
}

export {};
