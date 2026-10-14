import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const workflow = readFileSync(
  new URL("../../.github/workflows/auto-update-pr.yml", import.meta.url),
  "utf8",
);
const script = workflow.split("script: |\n")[1];

async function runScenario(options = {}) {
  const updates = [];
  const dispatches = [];
  const errors = [];
  let updated = false;
  const pr = {
    number: 1,
    state: "open",
    draft: false,
    auto_merge: {},
    mergeable: true,
    base: { ref: "dev" },
    head: {
      ref: "feat/example",
      sha: "old",
      repo: { full_name: "owner/repo" },
    },
    ...options.pr,
  };
  const github = {
    paginate: async () => [pr],
    rest: {
      pulls: {
        list: () => {},
        get: async () => ({
          data: {
            ...pr,
            head: { ...pr.head, sha: updated ? "new" : "old" },
          },
        }),
        updateBranch: async (args) => {
          updates.push(args);
          if (options.updateError) throw options.updateError;
          updated = !options.pending;
        },
      },
      repos: {
        compareCommitsWithBasehead: async () => ({
          data: { behind_by: updated ? 0 : (options.behind ?? 1) },
        }),
      },
      actions: {
        listWorkflowRuns: async (args) => {
          assert.equal(args.head_sha, updated ? "new" : "old");
          return { data: { total_count: options.existingRun ? 1 : 0 } };
        },
        createWorkflowDispatch: async (args) => dispatches.push(args),
      },
    },
  };
  await runInNewContext(`(async () => {${script}\n})()`, {
    github,
    context: { repo: { owner: "owner", repo: "repo" } },
    core: { info() {}, warning() {}, setFailed: (error) => errors.push(error) },
    setTimeout: (callback) => callback(),
  });
  return { updates, dispatches, errors };
}

test("updates with an expected head and dispatches CI after the new head appears", async () => {
  const result = await runScenario();
  assert.equal(result.updates[0].expected_head_sha, "old");
  assert.equal(result.dispatches.length, 1);
  assert.equal(result.dispatches[0].workflow_id, "ci.yml");
  assert.equal(result.dispatches[0].ref, "feat/example");
  assert.deepEqual(result.errors, []);
});

test("skips drafts, forks, closed PRs and PRs without auto-merge", async () => {
  for (const pr of [
    { draft: true },
    { state: "closed" },
    { auto_merge: null },
    { base: { ref: "main" } },
    { head: { ref: "fork", repo: { full_name: "other/repo" } } },
    { head: { ref: "main", repo: { full_name: "owner/repo" } } },
  ]) {
    const result = await runScenario({ pr });
    assert.equal(result.updates.length, 0);
    assert.equal(result.dispatches.length, 0);
  }
});

test("does not update conflicting PRs or dispatch CI for them", async () => {
  const result = await runScenario({ pr: { mergeable: false } });
  assert.equal(result.updates.length, 0);
  assert.equal(result.dispatches.length, 0);
});

test("does not dispatch against the old head while an update is pending", async () => {
  const result = await runScenario({ pending: true });
  assert.equal(result.updates.length, 1);
  assert.equal(result.dispatches.length, 0);
});

test("recovers CI dispatch after an earlier update without merging again", async () => {
  const result = await runScenario({ behind: 0 });
  assert.equal(result.updates.length, 0);
  assert.equal(result.dispatches.length, 1);
});

test("does not dispatch another CI run for the same head even if it failed", async () => {
  const result = await runScenario({ behind: 0, existingRun: true });
  assert.equal(result.updates.length, 0);
  assert.equal(result.dispatches.length, 0);
});

test("a concurrent head change stops the update instead of overwriting commits", async () => {
  const result = await runScenario({ updateError: { status: 422 } });
  assert.equal(result.dispatches.length, 0);
  assert.deepEqual(result.errors, []);
});

test("unexpected API failures mark the workflow failed", async () => {
  const result = await runScenario({
    updateError: { status: 403, message: "Forbidden" },
  });
  assert.equal(result.dispatches.length, 0);
  assert.match(result.errors[0], /Forbidden/);
});
