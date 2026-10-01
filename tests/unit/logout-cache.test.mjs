import assert from "node:assert/strict";
import test from "node:test";

import { QueryClient } from "@tanstack/react-query";

import { removeUserQueries } from "../../src/features/auth/utils/removeUserQueries.ts";

test("로그아웃 계정의 캐시만 제거하고 공개 목록과 다른 계정은 유지한다", () => {
  const client = new QueryClient();
  const privateKeys = [
    ["favorites", "list", "user-a"],
    ["products", "mine", "user-a"],
    ["products", "detail", "product", "user-a"],
    ["chat", "messages", "user-a", "room"],
    ["community", "myPosts", "user-a"],
    ["profiles", "seller", "user-a"],
  ];
  for (const key of privateKeys) client.setQueryData(key, "private");
  client.setQueryData(["products", "popular"], "public");
  client.setQueryData(["favorites", "list", "user-b"], "other");
  removeUserQueries(client, "user-a");
  for (const key of privateKeys)
    assert.equal(client.getQueryState(key), undefined);
  assert.equal(client.getQueryData(["products", "popular"]), "public");
  assert.equal(client.getQueryData(["favorites", "list", "user-b"]), "other");
  client.clear();
});

test("로그아웃 전에 시작한 조회는 취소되고 늦은 응답이 캐시를 복원하지 않는다", async () => {
  const client = new QueryClient();
  const key = ["favorites", "list", "user-a"];
  let complete;
  let signal;
  const pending = client.fetchQuery({
    queryKey: key,
    queryFn: (context) => {
      signal = context.signal;
      return new Promise((resolve) => {
        complete = resolve;
      });
    },
  });
  const rejected = assert.rejects(pending);
  removeUserQueries(client, "user-a");
  assert.equal(signal.aborted, true);
  complete("late private data");
  await rejected;
  assert.equal(client.getQueryState(key), undefined);
  client.clear();
});
