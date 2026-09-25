# Contributing to NODRA

Thanks for helping improve NODRA.

## Before you start

- Search [existing issues](https://github.com/hardikkanajariya-in/NODRA/issues) for duplicates.
- For larger changes (new storage backends, auth models, sync), open an issue first.

## Development setup

```bash
git clone https://github.com/hardikkanajariya-in/NODRA.git
cd NODRA
pnpm install
cp .env.example .env.local
pnpm dev
```

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Keep changes focused; match existing TypeScript and file layout.
3. Run `pnpm lint` and `pnpm test` before opening the PR.
4. Describe what changed and how you tested it.

## Code style

- TypeScript strict mode
- Server logic in `lib/`, UI in `components/` and `app/`
- Logseq parsing rules belong in `lib/logseq/` with Vitest coverage when behavior changes

## Community

Follow the [Code of Conduct](CODE_OF_CONDUCT.md).
