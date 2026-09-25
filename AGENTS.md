<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Strict project rule: NO TESTS

- Do NOT create, add, or maintain any test cases, test files, or test configurations in this project. This is a hard rule.
- Forbidden: `*.test.*`, `*.spec.*`, `__tests__/` directories, `tests/` / `test/` / `e2e/` directories, and any test runner config (Vitest, Jest, Playwright Test, Cypress, Testing Library, etc.).
- Do NOT add test scripts (e.g. `"test"`) to `package.json` and do NOT add test-related devDependencies.
- If a task template or default workflow would normally include writing tests, skip that step entirely without asking.
- Never reintroduce test tooling that was removed from this project.
