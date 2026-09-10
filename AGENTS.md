<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository Guidelines

## Required Convention Workflow

Before making changes:

1. Identify the type and scope of the task.
2. Read every applicable document in `docs/conventions/`.
3. Inspect nearby code for established local patterns.
4. Follow the stricter rule when local patterns and documented conventions differ.
5. Run the required validation commands before reporting completion.

Do not rely on remembered Next.js behavior. Before changing Next.js code, read
the relevant documentation under `node_modules/next/dist/docs/`.

## Convention Map

Read these documents according to the work being performed:

- All source-code changes:
  - `docs/conventions/naming-conventions.md`
  - `docs/conventions/file-folder-conventions.md`
  - `docs/conventions/function-conventions.md`
  - `docs/conventions/style-conventions.md`
- TypeScript changes:
  - `docs/conventions/typescript-conventions.md`
- React components and hooks:
  - `docs/conventions/react-conventions.md`
- UI design and styling:
  - `docs/conventions/style-conventions.md`
  - Use only typography classes defined in `src/styles/typography.css`.
  - Use `text-black-900` as the default text color unless the design assigns a
    semantic, inactive, error, or brand color.
- State, queries, stores, or URL state:
  - `docs/conventions/state-management-conventions.md`
- New files, modules, routes, or feature placement:
  - `docs/conventions/project-structure.md`
- Branches, commits, pull requests, or releases:
  - `docs/conventions/git-conventions.md`
  - `docs/conventions/merge-strategy.md`
  - `docs/conventions/pr-conventions.md` when pushing work branches or creating or editing pull requests or PR templates

If a task spans multiple categories, read all corresponding documents.

## Project Structure

- `src/app`: Next.js routes, layouts, loading, and error boundaries
- `src/features`: domain-specific UI and business logic
- `src/components`: shared and layout components
- `src/lib`: framework and external-library integration
- `src/hooks`, `src/types`, `src/utils`, `src/constants`: shared modules
- `src/assets`: imported images and icons
- `docs/conventions`: authoritative repository conventions

Keep route files thin. Place domain behavior in `src/features/{domain}` and
promote code to shared directories only when it is reused across domains.

## Development Commands

- `npm run dev`: start the local Next.js development server
- `npm run build`: create a production build
- `npm run typecheck`: run TypeScript without emitting files
- `npm run lint`: run ESLint
- `npm run format:check`: verify Prettier formatting
- `npm run check`: run type checking, linting, and formatting checks

Run `npm run check` after code changes. Run `npm run build` when changes affect
routing, rendering boundaries, configuration, or production behavior.

## Change Discipline

- Make only changes required by the task.
- Do not introduce unrelated refactors.
- Do not commit secrets or `.env` files.
- Remove debugging code such as `console.log`.
- Summarize changed files and validation results when completing work.

## After Pushing a Work Branch

- After successfully pushing a work branch, always provide a ready-to-copy PR
  title and body in the final response, without waiting for a separate request.
- Read `docs/conventions/pr-conventions.md` and
  `.github/pull_request_template.md`, inspect the full diff against the intended
  base branch, and fill in the actual changes, validation results, and limitations.
- Include the source and target branches and a PR creation link when available.
- Describe the complete PR scope, not only the most recent commit. Distinguish
  observed local validation from GitHub Actions results that have not been checked.
- Providing PR text does not itself create or update a PR. State clearly whether
  the PR was actually created or only its title and body were prepared.
