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

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Bun Documentation](https://bun.sh/docs)
- [Ollama Documentation](https://ollama.ai/docs)
- [shadcn/ui](https://ui.shadcn.com)
