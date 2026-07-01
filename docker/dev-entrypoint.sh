#!/usr/bin/env bash
# Boot sequence for a dev instance container. Runs against the bind-mounted
# source with linux-native node_modules / .next / src/generated provided by
# named volumes (see docker-compose.yml).
set -euo pipefail

echo "▶ [${INSTANCE:-dev}] entrypoint starting"

# 1 + 2. Install deps into the persisted node_modules volume and generate the
#        Prisma client into the src/generated volume. Skip on warm restarts
#        where nothing changed (SKIP_INSTALL=1).
if [[ "${SKIP_INSTALL:-0}" != "1" ]]; then
	echo "▶ bun install"
	bun install
	echo "▶ prisma generate"
	bunx --bun prisma generate
else
	echo "▷ SKIP_INSTALL=1 — skipping install + prisma generate"
fi

# 3. Apply migrations to this instance's Neon branch. prisma.config.ts reads
#    DATABASE_URL, so we override it with the UNPOOLED endpoint for this command
#    only — Neon's pooled (PgBouncer) connection can't run DDL/advisory locks.
#    The runtime keeps using the pooled DATABASE_URL from the env file.
if [[ "${SKIP_MIGRATE:-0}" != "1" ]]; then
	if [[ -z "${DATABASE_URL_UNPOOLED:-}" ]]; then
		echo "❌ DATABASE_URL_UNPOOLED is required for migrations." >&2
		exit 1
	fi
	echo "▶ prisma migrate deploy (against UNPOOLED endpoint)"
	DATABASE_URL="$DATABASE_URL_UNPOOLED" bunx --bun prisma migrate deploy
else
	echo "▷ SKIP_MIGRATE=1 — skipping prisma migrate deploy"
fi

# 4. Hand off to the dev server. `-H 0.0.0.0` is required so the host port
#    mapping can reach it; `exec` makes Next PID 1 for clean SIGTERM shutdown.
#    Override DEV_COMMAND to switch off Turbopack (--webpack) if HMR over the
#    bind mount misses edits.
DEV_COMMAND="${DEV_COMMAND:-bunx --bun next dev -p 3000 -H 0.0.0.0}"
echo "▶ $DEV_COMMAND"
exec bash -c "$DEV_COMMAND"
