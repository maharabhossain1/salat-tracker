# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Salat tracker built on Next.js 16 (App Router, React 19, React Compiler enabled), TypeScript, Drizzle ORM + PostgreSQL, NextAuth v5, Tailwind v4, and shadcn/ui. Scaffolded via `next-op-cli` — most feature code is not yet written (dashboard is a stub).

Package manager is **pnpm** (v10, Node >= 24). Use `pnpm`, not npm/yarn.

**Always prefix commands with `nvm use &&`** to pin Node to `.nvmrc` (24.14.1). This applies to every install/run — dependencies, shadcn components, drizzle, etc. Examples:

```bash
nvm use && pnpm install
nvm use && pnpm add <pkg>
nvm use && pnpm dlx shadcn@latest add button   # adding shadcn/ui components
nvm use && pnpm dev
```

## Local database (Docker)

Postgres runs in Docker via `docker-compose.yml` (postgres:17, db `mydb`, user/password `user`/`password`, port 5432). The connection string matches `DATABASE_URL` in `.env.local` out of the box — no manual setup.

`pnpm dev` runs `pnpm db:up` (which is `docker compose up -d --wait`, blocking until Postgres is healthy) before starting Next. Use `pnpm db:down` to stop it. Data persists in the `salat-tracker-pgdata` volume.

## Commands

```bash
pnpm dev              # starts Postgres (docker) then dev server (Turbopack)
pnpm db:up            # start Postgres container, wait for healthy
pnpm db:down          # stop Postgres container
pnpm build            # production build
pnpm start            # serve production build
pnpm lint             # eslint
pnpm lint:fix         # eslint --fix
pnpm format           # prettier --write .
pnpm type-check       # tsc --noEmit

pnpm db:generate      # generate migration from schema changes → lib/db/migrations
pnpm db:migrate       # apply migrations
pnpm db:push          # push schema directly (dev)
pnpm db:studio        # drizzle studio GUI
```

No test runner is configured yet.

Pre-commit hook (husky) runs `lint-staged` (eslint --fix + prettier) then `tsc --noEmit`. A commit fails on any type error.

## Architecture

### Auth (NextAuth v5 / Auth.js)

- Central config in `auth.ts` exports `{ handlers, auth, signIn, signOut }`. Import `auth` from `@/auth` everywhere.
- Two providers: GitHub OAuth and Credentials (email + bcrypt password via `lib/auth/password.ts`).
- Session strategy is **JWT** (not DB sessions). `jwt`/`session` callbacks thread `user.id` into the session.
- DrizzleAdapter wires NextAuth to the DB tables in `lib/db/schema/auth.ts` (accounts, sessions, verificationTokens) + `users`.
- Route handler at `app/api/auth/[...nextauth]/route.ts` re-exports `handlers`.

### Route protection — two layers

1. **`proxy.ts`** (repo root) — this is the Next.js 16 middleware (renamed from `middleware.ts`). Wraps `auth(...)`, redirects unauthenticated `/dashboard` → `/login` and authenticated users away from auth pages. Matcher excludes `api`, `_next/*`, favicon.
2. **Server-side guard** in `app/(dashboard)/layout.tsx` — `await auth()` then `redirect('/login')`. Both layers exist; keep them in sync when adding protected routes.

### Database (Drizzle + postgres-js)

- `lib/db/index.ts` exports `db`. Schema split across `lib/db/schema/*.ts`, re-exported from `lib/db/schema/index.ts`.
- IDs are `uuid` with `defaultRandom()`. Tables use snake_case columns, `withTimezone` timestamps.
- Schema is the source of truth: edit schema files → `pnpm db:generate` → `pnpm db:migrate`.
- `drizzle.config.ts` points at `./lib/db/schema`, outputs to `./lib/db/migrations`.

### Env validation

`config/env.ts` parses `process.env` with Zod at import time — missing/invalid env vars throw on boot. Add new env vars to this schema. `.env.local` for local secrets; `.env.example` documents required keys.

### State & UI

- Client state: Zustand stores in `store/` (e.g. `useUiStore`), barrel-exported from `store/index.ts`.
- shadcn/ui components in `components/ui/`. Aliases in `components.json`. Add with shadcn CLI. `cn()` helper in `lib/utils.ts`.
- Route groups: `app/(auth)` and `app/(dashboard)` for separate layouts.

## Conventions (enforced by ESLint — `eslint.config.mjs`)

- **Filenames must be kebab-case** (unicorn/filename-case).
- **No relative import paths** — use the `@/*` alias (maps to repo root) instead of `../`. Same-folder relative is allowed.
- **Type imports must use `import type`** (consistent-type-imports).
- Import order is enforced and auto-sorted (builtin → external → internal, alphabetized, newlines between groups).
- Prettier violations are ESLint errors.
- Build does **not** ignore type errors (`typescript.ignoreBuildErrors: false`).
