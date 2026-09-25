# NODRA

NODRA is a self-hosted block notebook: daily journals, wiki-style pages, and a page graph. The editor understands Logseq-style nested bullets, `[[page links]]`, tags, properties, and paste from Logseq.

- **Site:** [hardikkanajariya-in.github.io/NODRA](https://hardikkanajariya-in.github.io/NODRA/)
- **Repository:** [github.com/hardikkanajariya-in/NODRA](https://github.com/hardikkanajariya-in/NODRA)

## Features

- Password-protected single-user access (password from environment variables)
- Daily journals at `/journal/YYYY-MM-DD`
- Pages at `/page/<slug>`
- Nested block editor (Tab / Shift+Tab, Enter, autosave)
- Logseq Markdown paste (plain text and HTML clipboard)
- `[[Page references]]`, `#tags`, `key:: value` properties
- Block references `((uuid))` and embed placeholders
- Image paste and upload (Cloudflare R2)
- Page graph with pan, zoom, and search

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

Edit `.env.local` with your values, then apply the schema:

```bash
pnpm db:push
```

Run locally:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with `APP_PASSWORD`.

### Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `APP_PASSWORD` | Login password (not stored in the database) |
| `SESSION_SECRET` | Signs the session cookie |
| `R2_*` | Cloudflare R2 credentials for assets |
| `NEXT_PUBLIC_APP_URL` | Public URL of your deployment |

### Database migrations

SQL migrations live in [`drizzle/`](drizzle/). For a fresh database you can use `pnpm db:push` or run `drizzle/0000_initial.sql` against your instance.

### Production

Deploy as a standard Next.js application. Set the environment variables in your host, run migrations, then build:

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
