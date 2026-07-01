# CLAUDE.md

Guidance for Claude working in this repo. Human setup lives in [README.md](README.md);
this file is the agent-facing runbook.

## Project

RRC App — Regina Rowing Club app for athletes, workouts, activities, and equipment.

- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript
- **Bun** is the runtime and package manager — always use `bun` / `bunx`, never npm/yarn/pnpm
- **Prisma 7** on **Neon** Postgres via the serverless adapter (`@prisma/adapter-neon`) — the DB is Neon cloud, not a local Postgres
- **Clerk** auth, **tRPC** API, **Ollama** (local vision model) for screenshot parsing
- Lint/format: **Biome** (tabs, not spaces)

## Everyday commands

```bash
bun dev                 # Next.js dev + auto-starts native Ollama (port 3000)
bun test                # vitest
bun lint                # biome check
bun run lint:fix        # biome autofix
bun run db:migrate      # prisma migrate dev
bun run db:branch:create / db:branch:reset   # the single shared `develop` Neon branch
```

Env is validated at import in [src/lib/env.ts](src/lib/env.ts) and **throws at boot** if a
required var is missing: `DATABASE_URL`, `INTEGRATION_TOKEN_ENCRYPTION_KEY`,
`NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID`, plus Clerk's `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
and `CLERK_SECRET_KEY`. Migrations run against the **unpooled** connection
(`DATABASE_URL_UNPOOLED`); the app runtime uses the pooled `DATABASE_URL`.

## Worktrees & isolated instances

This repo is developed with **git worktrees** — the primary checkout is at
`…/rrc-app`, and each branch gets its own worktree under `…/rrc-app-worktrees/<name>`.

Any worktree can run as a fully **isolated instance**: its own Docker container at its own
`localhost` port, backed by its own **forked Neon database branch**. Use this to test
migrations, run a version live, or compare branches — without touching `main` or other
instances. Implemented by [scripts/instance.ts](scripts/instance.ts) +
[docker-compose.yml](docker-compose.yml); see the README "Multiple instances" section for
the human-facing version.

### Prerequisites (do not skip)

- **Docker Desktop must be running.** Check with `docker info`; if it's down, start it
  (`open -a Docker`) and wait until `docker info` succeeds before running `instance:*`.
- **No per-worktree `.env` is needed.** The CLI auto-loads `NEON_*` creds and shared
  secrets from the **primary worktree's `.env`** when the current worktree has none. (Only
  create a local `.env` if you also want to run `bun dev` natively here.)

### Commands — all auto-derive the instance name from the current git branch

Run these from inside the worktree you want to containerize. The name comes from the
branch (sanitized), the host port is auto-allocated from 3001, and the Neon branch is
`inst/<name>`.

| Command | Effect |
|---|---|
| `bun run instance:create` | Fork Neon branch off `main` **and** build + start the container (up). `--parent <branch>` / `--port <n>` to override. Idempotent. |
| `bun run instance:list` | All instances (across worktrees): name, URL, branch, status, dir. |
| `bun run instance:logs` | Tail the container logs. |
| `bun run instance:migrate` | Apply migrations to this instance's Neon branch only. |
| `bun run instance:reset` | Re-fork this instance's Neon branch from its parent (clean slate for re-testing migrations). |
| `bun run instance:down` | Pause: stop the container but **keep** the Neon branch + volumes. |
| `bun run instance:destroy` | Full teardown: remove container + volumes + image + **delete the Neon branch** + env file. |

### Lifecycle rule (the Neon branch is bound to the container)

- `create` = **up**: branch created with the container.
- `destroy` = **down**: branch deleted with the container. One live instance ⇄ one live Neon branch.
- `down` is only a pause (branch kept; Neon auto-suspends idle compute, so it's free).
- **Always `instance:destroy` when you're done** — each instance holds an open Neon branch, and branch quota is finite.

### Starting work in a fresh worktree

```bash
git worktree add ../rrc-app-worktrees/my-feature -b my-feature
cd ../rrc-app-worktrees/my-feature
bun run instance:create        # → http://localhost:3001 on Neon branch inst/my-feature
```

### Testing a migration

```bash
# edit prisma/schema.prisma, then:
bun run instance:migrate       # applies to this branch only
bun run instance:reset         # re-fork from parent to test again from clean
bun run instance:migrate
```

### Verifying an instance is up (important operational detail)

`instance:create` returns as soon as the container **starts**, but the entrypoint then runs
install → `prisma generate` → `migrate deploy` → `next dev` before the app listens, and the
first HTTP request triggers a Turbopack compile. So don't curl immediately. Wait for
readiness first:

```bash
# poll the log, then hit it
until docker logs rrc-<name>-app 2>&1 | grep -q "Ready in"; do sleep 2; done
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:<port>/login   # expect 200
# "/" returns 307 -> /login (Clerk middleware) — that's healthy, not an error
```

Container is `rrc-<name>-app`; compose project is `rrc-<name>`.

### Gotchas

- **`bun.lockb` churns**: any `bun run …` in this repo may rewrite `bun.lockb`. That change
  is incidental — **do not commit it** (`git checkout -- bun.lockb`) unless you actually
  changed dependencies.
- **Hot reload is best-effort** over the macOS bind mount (file-watch polling). If edits
  don't reload, set `DEV_COMMAND="bunx --bun next dev --webpack -p 3000 -H 0.0.0.0"` in that
  instance's `docker/env/<name>.env`, or use `docker compose watch`.
- The dev image uses `bun install` **without** `--frozen-lockfile` on purpose — the host
  lockfile must add linux-native optional deps in the container.
- Per-instance env files live at `docker/env/<name>.env` (gitignored). The instance
  registry is `<git-common-dir>/rrc-instances.json`, shared across worktrees so ports never
  collide.

## Conventions

- Match surrounding code; Biome tabs. Keep changes surgical — don't rewrite working code or
  add comments that restate it.
- Prisma client is generated to `src/generated/prisma` (gitignored); run `prisma generate`
  if it's missing.
- Do not commit unless explicitly asked.
