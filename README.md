# NODRA

NODRA is a self-hosted block notebook: daily journals, wiki-style pages, and a page graph. The editor understands Logseq-style nested bullets, `[[page links]]`, tags, properties, and paste from Logseq.

- **Site:** [hardikkanajariya-in.github.io/NODRA](https://hardikkanajariya-in.github.io/NODRA/)
- **Repository:** [github.com/hardikkanajariya-in/NODRA](https://github.com/hardikkanajariya-in/NODRA)

## Features

- Username/password accounts with per-graph ownership and sharing
- Daily journals at `/journal/YYYY-MM-DD`
- Pages at `/pages/<slug>`
- Nested block editor (Tab / Shift+Tab, Enter, autosave)
- Logseq Markdown paste (plain text and HTML clipboard)
- Optional link to your Logseq graph `assets/` folder (Chromium browsers) so pasted blocks can pull image files the clipboard omits
- `[[Page references]]`, `#tags`, `key:: value` properties
- Block references `((uuid))` and embed placeholders
- Image paste and upload (Cloudflare R2)
- Page graph with pan, zoom, and search
- Multiple isolated graphs (switch or create from the sidebar)

## Stack

Next.js, TypeScript, Tiptap, Neon PostgreSQL, Drizzle ORM, Cloudflare R2, Tailwind CSS.

## Self-hosting

### Requirements

- Node.js 20+
- [pnpm](https://pnpm.io/installation) 10+
- PostgreSQL (Neon or any compatible host)
- Cloudflare R2 bucket (optional; required for image uploads)

### Setup

```bash
git clone https://github.com/hardikkanajariya-in/NODRA.git
cd NODRA
pnpm install
cp .env.example .env.local
```

Edit `.env.local` with your values (`DATABASE_URL` is required for the app to run).

The database schema is applied automatically when you run `pnpm dev` or `pnpm build` (via `pnpm db:sync`).

Run locally:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), register an account, and sign in.

**Upgrading an existing notebook:** after deploy, remove `APP_PASSWORD` from the environment. Everyone must register again (old session cookies are invalid). The **first** account created on the instance becomes owner of all graphs that existed before multi-user auth—coordinate who registers first on private deployments.

If you paste from Logseq Desktop and images appear as filenames only, open **Settings** and link that graph’s `assets` folder on **this browser/device** (each graph has its own link; nothing is stored on the server). Folder access stays in your browser; use Chrome, Edge, or another Chromium-based browser for this feature.

### Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Signs the session cookie |
| `R2_*` | Cloudflare R2 credentials for assets |
| `NEXT_PUBLIC_APP_URL` | Public URL of your deployment |

### Database schema

Schema is defined in [`lib/db/schema.ts`](lib/db/schema.ts). On deploy and local `dev`/`build`, `scripts/apply-schema.mjs` runs `drizzle-kit push` against `DATABASE_URL`. To skip sync (e.g. CI without a database), set `SKIP_DB_SYNC=1`. Manual override: `pnpm db:push` or `pnpm db:sync`.

### Production

Deploy as a standard Next.js application. Set environment variables on the host (including `DATABASE_URL` for the build step). `pnpm build` applies the schema automatically, then compiles the app:

```bash
pnpm build
pnpm start
```

A `vercel.json` is included for hosts that support it.

## Development

```bash
pnpm dev
pnpm lint
pnpm test
```

## License

MIT — see [LICENSE](LICENSE).

## Security

Report vulnerabilities via [GitHub Security Advisories](https://github.com/hardikkanajariya-in/NODRA/security/advisories) or contact@hardikkanajariya.in. See [SECURITY.md](SECURITY.md).
