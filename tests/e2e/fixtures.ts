import { expect, test as base } from "@playwright/test";

export const test = base.extend<{ blockProductionAuth: void }>({
  blockProductionAuth: [
    async ({ context }, use) => {
      const blockedRequests: string[] = [];
      await context.route(
        /^https:\/\/(identitytoolkit|securetoken)\.googleapis\.com\//,
        async (route) => {
          blockedRequests.push(route.request().url());
          await route.abort();
        },
      );

      await use();

      expect(
        blockedRequests,
        "테스트는 운영 인증 API에 접근하면 안 됩니다.",
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
