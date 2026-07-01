# RRC App

Regina Rowing Club application for managing athletes, workouts, activities, and equipment.

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Set up Ollama for AI features (one-time setup)
bun run setup:ollama

# 3. Configure environment
cp .env.example .env
# Edit .env with your Clerk, Concept2, and Strava credentials

# 4. Run development server (automatically starts Ollama)
bun dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## Features

- **AI-Powered Screenshot Parsing** - Upload Concept2 ERG screenshots and workout calendars to automatically extract structured data
- **Athlete Management** - Track rowers and their activities
- **Workout & Activity Tracking** - Monitor training sessions and performance
- **Equipment Management** - Track boats and ergs
- **Integrations** - Connect with Concept2 and Strava

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Runtime**: Bun
- **Styling**: Tailwind CSS + shadcn/ui
- **AI**: Ollama (local vision model)
- **Auth**: Clerk

## Getting Started

### Prerequisites

- Bun installed
- Ollama will be installed automatically via setup script

### 1. Install Dependencies

```bash
bun install
```

### 2. Set Up Ollama (for AI Features)

We use Ollama locally for optimal performance on Apple Silicon.

#### Option A: Automated Setup (Recommended)

Run the setup script to automatically install and configure everything:

```bash
bun run setup:ollama
```

This script will:
- Install Ollama via Homebrew (if not already installed)
- Download the llava:13b model (~8GB)
- Create an optimized model configuration for M2 Max

**Note:** The Ollama server will start automatically when you run `bun dev`.

#### Option B: Manual Setup

```bash
# Install Ollama
brew install ollama

# Pull the vision model
ollama pull llava:13b
```

**Note:** No need to manually run `ollama serve` - it starts automatically with `bun dev`.

#### Why Local Ollama?

- **Performance**: 10-50x faster inference (2-5s vs 30s+) with Metal GPU acceleration
- **Privacy**: Data never leaves your machine
- **Cost**: No API fees or rate limits
- **Memory**: Uses unified memory efficiently on M2 Max

#### Performance Expectations (M2 Max)

- Screenshot parsing: 2-5 seconds (after model loaded)
- Memory usage: ~10-15GB when loaded
- First request: 60-90s (model loading into memory)
- Subsequent: 2-5s (model cached in memory)

#### Monitoring & Troubleshooting

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# List loaded models
ollama ps

# View all models
ollama list
```

**Common Issues:**
- **"Cannot connect"**: Ollama should auto-start with `bun dev`. If not, run `bun run start:ollama`
- **"Model not found"**: Run `bun run setup:ollama` or `ollama pull llava:13b`
- **Slow performance**: Ensure 20GB+ free RAM, close memory-heavy apps
- **Timeout errors**: First request can take 60-90s (model loading). Subsequent requests are 2-5s

#### Alternative Models

| Model | Size | Memory | Use Case |
|-------|------|--------|----------|
| `llava:7b` | 4.5GB | ~8GB RAM | Fastest, basic tasks |
| `llava:13b` | 8GB | ~15GB RAM | **Recommended** |
| `llava:34b` | 20GB | ~30GB RAM | Higher accuracy |

To switch models, set in `.env`:
```bash
OLLAMA_MODEL=llava:34b
```

### 3. Configure Environment

Copy the example environment file and configure your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your:
- **Clerk** authentication keys (required)
- **Concept2** API credentials (optional - for ERG data import)
- **Strava** API credentials (optional - for activity sync)
- **SIGNUP_CODE** - Generate a new UUID for user registration

**Note:** Ollama settings are commented out by default and will use the optimized defaults from [src/lib/env.ts](src/lib/env.ts) (`llava:13b` model on `localhost:11434`).

### 4. Run Development Server

```bash
bun dev
```

This command will:
1. Automatically start the Ollama server (if not already running)
2. Start the Next.js development server

Open [http://localhost:3000](http://localhost:3000) to see the app.

## AI Screenshot Parsing

The app can parse:
- **Concept2 ERG Screenshots** - Extract workout data (distance, time, pace, etc.)
- **Weekly Workout Calendars** - Parse multiple workouts from training plan images

Expected performance on M2 Max:
- **Inference time**: 2-5 seconds per image (after initial model load)
- **First load**: 60-90 seconds (one-time per session)
- **Model**: llava:13b (8GB)
- **Accuracy**: High for structured data extraction

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── activities/         # Activity management
│   ├── athletes/           # Athlete management
│   ├── boats/              # Boat management
│   ├── ergs/               # ERG management
│   ├── workouts/           # Workout management
│   └── api/v1/            # API routes
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   └── layouts/           # Layout components
├── lib/                   # Utilities and configs
│   ├── ai/                # AI parsing logic
│   ├── formatters/        # Data formatters
│   └── parsers/           # Data parsers
├── schemas/               # Zod schemas
└── scenes/                # Feature scenes/modules
```

## Available Scripts

```bash
bun dev              # Start dev server (auto-starts Ollama)
bun dev:next         # Start Next.js dev server only
bun build            # Build for production
bun start            # Start production server
bun test             # Run tests
bun lint             # Run linter
bun run setup:ollama # Initial Ollama setup (one-time)
bun run start:ollama # Manually start Ollama server
bun run db:migrate         # Run Prisma migrations
bun run db:branch:create   # Create a Neon `develop` branch off `main`
bun run db:branch:reset    # Reset `develop` back on top of `main`

bun run instance:create    # Spin up an isolated dev container + Neon branch
bun run instance:list      # List all instances (ports, branches, status)
bun run instance:logs      # Tail an instance's container logs
bun run instance:migrate   # Apply migrations to an instance's Neon branch
bun run instance:reset     # Re-fork an instance's Neon branch from its parent
bun run instance:down      # Pause an instance (keeps its Neon branch)
bun run instance:destroy   # Remove an instance + delete its Neon branch
```

## Database (Neon)

For local development we work against a Neon branch called `develop` so that
nothing touches the `main` branch. Authenticate the Neon CLI once with
`bunx neonctl auth` (or set `NEON_API_KEY`), then set `NEON_PROJECT_ID` in
`.env`.

```bash
# Spin up a fresh `develop` branch off `main` and print connection strings
bun run db:branch:create

# Paste the printed DATABASE_URL / DATABASE_URL_UNPOOLED into .env, then:
bun run db:migrate

# When `develop` drifts or accumulates junk, reset it on top of `main`
bun run db:branch:reset
```

## Multiple instances (Docker + Neon branches)

To run several versions of the app side-by-side — each at its own
`localhost:<port>` and backed by its own forked Neon database branch — use the
`instance:*` workflow. This is ideal for testing migrations or comparing
branches in isolation without touching `main` or each other.

Each instance is a hot-reload dev container (your source is bind-mounted, so
edits reload live) that connects out to its own Neon branch. The host's native
Ollama is shared via `host.docker.internal`, so no Ollama container is needed.

**Prerequisites:** Docker Desktop running, and a populated `.env` with the shared
secrets + `NEON_*` credentials. The `.env` can live in the current worktree or in
the primary worktree — the CLI auto-loads it, so a fresh worktree needs no local
`.env` of its own. Each instance's env file is generated from it.

```bash
# From inside a git worktree/branch — the instance name is auto-derived from the
# current branch and the host port is auto-allocated (3001, 3002, ...).
bun run instance:create

# Fork from a different parent branch, or pin the port:
bun run instance:create --parent develop --port 3005

# See everything that's running
bun run instance:list

# Tail logs / open a second instance from another worktree, etc.
bun run instance:logs
```

**Lifecycle — the Neon branch is bound to the container:**

- `instance:create` forks a Neon branch `inst/<name>` off `main` (configurable
  with `--parent`) **and** starts the container, in one step.
- `instance:destroy` removes the container + volumes **and** deletes the Neon
  branch, in one step — nothing is left orphaned.
- `instance:down` is a pause: it stops the container but keeps the branch (Neon
  auto-suspends idle compute, so a paused branch costs nothing). Restart it by
  running `instance:create` again.

**Testing migrations:**

```bash
# Edit prisma/schema.prisma + add a migration, then apply it to this instance's
# branch only (other instances and main are untouched):
bun run instance:migrate

# Re-fork the branch from its parent to test the migration from a clean state:
bun run instance:reset
bun run instance:migrate
```

**Where things live:**

- Per-instance env files: `docker/env/<name>.env` (gitignored; generated from
  your base `.env` with the branch's `DATABASE_URL` / `DATABASE_URL_UNPOOLED`
  and per-port OAuth callback URLs filled in).
- Instance registry: `<git-common-dir>/rrc-instances.json` (shared across
  worktrees so ports never collide).

**Notes & caveats:**

- Hot reload across the macOS bind mount uses file polling and is best-effort.
  If edits don't reload during focused work on one instance, set
  `DEV_COMMAND="bunx --bun next dev --webpack -p 3000 -H 0.0.0.0"` in that
  instance's env file, or use `docker compose watch`.
- Each instance holds an open Neon branch; mind your plan's branch quota and
  `instance:destroy` ones you're done with.
- The base `.env`'s `INTEGRATION_TOKEN_ENCRYPTION_KEY` is reused so that
  integration tokens forked from `main` remain decryptable.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Bun Documentation](https://bun.sh/docs)
- [Ollama Documentation](https://ollama.ai/docs)
- [shadcn/ui](https://ui.shadcn.com)
