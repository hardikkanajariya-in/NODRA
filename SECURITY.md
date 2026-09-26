# Security policy

## Supported versions

Security fixes are applied on the `main` branch. Use the latest commit or release when self-hosting.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security problems.

1. Use [GitHub Security Advisories](https://github.com/hardikkanajariya-in/NODRA/security/advisories/new) for this repository, or
2. Email **contact@hardikkanajariya.in** with a description and steps to reproduce.

We will acknowledge receipt and work on a fix as soon as practical.

## Deployment notes

- Keep `SESSION_SECRET` and database credentials out of version control.
- Use HTTPS in production so session cookies are protected.
- Restrict database and R2 credentials to your deployment environment only.
