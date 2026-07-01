#!/usr/bin/env bun

/**
 * Orchestrate multiple isolated dev instances of the app, each on its own
 * localhost port and backed by its own forked Neon database branch.
 *
 *   bun run instance:create     # from a worktree — name auto-derived from branch
 *   bun run instance:list
 *   bun run instance:logs
 *   bun run instance:migrate
 *   bun run instance:reset
 *   bun run instance:down
 *   bun run instance:destroy
 *
 * One live instance ⇄ one live Neon branch: `create` forks the branch and starts
 * the container together; `destroy` deletes the branch and removes the container
 * together. `down` is a pause that keeps the branch.
 */

import { spawn } from "bun";
import { basename, isAbsolute, join, resolve } from "node:path";
import {
	branchExists,
	connectionStrings,
	createBranch,
	deleteBranch,
	requireNeonEnv,
	resetBranch,
} from "./lib/neon";

const FIRST_PORT = 3001;
const DEFAULT_PARENT = "main";

interface InstanceRecord {
	name: string;
	port: number;
	branch: string;
	parent: string;
	projectDir: string;
	createdAt: string;
}

type Registry = Record<string, InstanceRecord>;

// ── shell helpers ──────────────────────────────────────────────────────────

async function capture(
	cmd: string[],
	cwd?: string,
): Promise<{ stdout: string; exitCode: number }> {
	const proc = spawn(cmd, {
		stdout: "pipe",
		stderr: "pipe",
		cwd,
		env: process.env,
	});
	const stdout = await new Response(proc.stdout).text();
	const exitCode = await proc.exited;
	return { stdout: stdout.trim(), exitCode };
}

async function inherit(
	cmd: string[],
	opts: { cwd?: string; env?: Record<string, string> } = {},
): Promise<number> {
	const proc = spawn(cmd, {
		stdout: "inherit",
		stderr: "inherit",
		stdin: "inherit",
		cwd: opts.cwd,
		env: { ...process.env, ...opts.env },
	});
	return await proc.exited;
}

// ── git / naming ───────────────────────────────────────────────────────────

function sanitize(raw: string): string {
	return raw
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-");
}

async function currentBranch(): Promise<string | null> {
	const { stdout, exitCode } = await capture([
		"git",
		"rev-parse",
		"--abbrev-ref",
		"HEAD",
	]);
	if (exitCode !== 0 || !stdout || stdout === "HEAD") return null;
	return stdout;
}

/** The shared git directory, so the registry is shared across all worktrees. */
async function gitCommonDir(): Promise<string> {
	const { stdout, exitCode } = await capture([
		"git",
		"rev-parse",
		"--git-common-dir",
	]);
	if (exitCode !== 0 || !stdout) return resolve(process.cwd(), ".git");
	return isAbsolute(stdout) ? stdout : resolve(process.cwd(), stdout);
}

/** Path to the main worktree (first entry of `git worktree list`). */
async function mainWorktree(): Promise<string | null> {
	const { stdout, exitCode } = await capture([
		"git",
		"worktree",
		"list",
		"--porcelain",
	]);
	if (exitCode !== 0) return null;
	const match = stdout.match(/^worktree (.+)$/m);
	return match ? match[1] : null;
}

/**
 * Resolve the instance name: explicit arg wins, else the sanitized current git
 * branch, else the worktree directory basename.
 */
async function resolveName(explicit?: string): Promise<string> {
	if (explicit) return sanitize(explicit);
	const branch = await currentBranch();
	if (branch) return sanitize(branch);
	return sanitize(basename(process.cwd()));
}

// ── registry ───────────────────────────────────────────────────────────────

async function registryPath(): Promise<string> {
	return join(await gitCommonDir(), "rrc-instances.json");
}

async function readRegistry(): Promise<Registry> {
	const path = await registryPath();
	const file = Bun.file(path);
	if (!(await file.exists())) return {};
	try {
		return (await file.json()) as Registry;
	} catch {
		return {};
	}
}

async function writeRegistry(reg: Registry): Promise<void> {
	await Bun.write(await registryPath(), `${JSON.stringify(reg, null, 2)}\n`);
}

function nextFreePort(reg: Registry, requested?: number): number {
	const used = new Set(Object.values(reg).map((r) => r.port));
	if (requested !== undefined) {
		if (used.has(requested)) {
			console.error(`❌ Port ${requested} is already used by another instance.`);
			process.exit(1);
		}
		return requested;
	}
	let port = FIRST_PORT;
	while (used.has(port)) port++;
	return port;
}

// ── env file generation ──────────────────────────────────────────────────────

const REQUIRED_ENV_KEYS = [
	"DATABASE_URL",
	"DATABASE_URL_UNPOOLED",
	"INTEGRATION_TOKEN_ENCRYPTION_KEY",
	"NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID",
	"NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
	"CLERK_SECRET_KEY",
];

function parseEnv(text: string): Map<string, string> {
	const out = new Map<string, string>();
	for (const line of text.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eq = trimmed.indexOf("=");
		if (eq === -1) continue;
		out.set(trimmed.slice(0, eq).trim(), trimmed.slice(eq + 1));
	}
	return out;
}

function serializeEnv(map: Map<string, string>): string {
	return `${[...map].map(([k, v]) => `${k}=${v}`).join("\n")}\n`;
}

/** Find the base .env to seed shared secrets from, or null if none exists. */
async function findBaseEnv(explicit?: string): Promise<string | null> {
	const candidates: string[] = [];
	if (explicit) candidates.push(resolve(explicit));
	candidates.push(resolve(process.cwd(), ".env"));
	const main = await mainWorktree();
	if (main) candidates.push(join(main, ".env"));
	for (const path of candidates) {
		if (await Bun.file(path).exists()) return path;
	}
	return null;
}

/** Locate the base .env, or exit with a helpful message if none is found. */
async function resolveBaseEnv(explicit?: string): Promise<string> {
	const path = await findBaseEnv(explicit);
	if (!path) {
		console.error(
			`❌ No base .env found (looked in this worktree and the primary worktree).\n` +
				`   Create a .env with the shared secrets, or pass --base-env <path>.`,
		);
		process.exit(1);
	}
	return path;
}

/**
 * Load the base .env into process.env (without overriding anything already set)
 * so the Neon CLI credentials resolve even in a fresh git worktree that has no
 * local .env — Bun only auto-loads .env from the current directory.
 */
async function loadBaseEnv(explicit?: string): Promise<void> {
	const path = await findBaseEnv(explicit);
	if (!path) return;
	for (const [k, v] of parseEnv(await Bun.file(path).text())) {
		if (process.env[k] === undefined) process.env[k] = v;
	}
}

async function generateEnvFile(
	projectDir: string,
	name: string,
	port: number,
	pooled: string,
	unpooled: string,
	baseEnvPath: string,
): Promise<string> {
	const base = parseEnv(await Bun.file(baseEnvPath).text());

	// Override the per-instance values.
	base.set("DATABASE_URL", pooled);
	base.set("DATABASE_URL_UNPOOLED", unpooled);
	base.set(
		"STRAVA_CALLBACK_URL",
		`http://localhost:${port}/api/v1/strava/callback`,
	);
	base.set(
		"CONCEPT2_CALLBACK_URL",
		`http://localhost:${port}/api/v1/concept2/callback`,
	);

	const missing = REQUIRED_ENV_KEYS.filter((k) => !base.get(k));
	if (missing.length > 0) {
		console.error(
			`❌ Base env (${baseEnvPath}) is missing required keys: ${missing.join(", ")}.\n` +
				`   The container would crash at boot without them.`,
		);
		process.exit(1);
	}

	const envPath = join(projectDir, "docker", "env", `${name}.env`);
	await Bun.write(
		envPath,
		`# Generated by scripts/instance.ts for instance "${name}" (port ${port}).\n` +
			`# Do not edit by hand — re-run "bun run instance:create" to regenerate.\n` +
			serializeEnv(base),
	);
	return envPath;
}

// ── docker compose ───────────────────────────────────────────────────────────

function project(name: string): string {
	return `rrc-${name}`;
}

function composeEnv(rec: InstanceRecord): Record<string, string> {
	return { INSTANCE: rec.name, APP_PORT: String(rec.port) };
}

async function compose(
	rec: InstanceRecord,
	args: string[],
): Promise<number> {
	return inherit(["docker", "compose", "-p", project(rec.name), ...args], {
		cwd: rec.projectDir,
		env: composeEnv(rec),
	});
}

// ── commands ─────────────────────────────────────────────────────────────────

function parseFlags(argv: string[]): {
	positional: string[];
	flags: Record<string, string>;
} {
	const positional: string[] = [];
	const flags: Record<string, string> = {};
	for (const arg of argv) {
		if (arg.startsWith("--")) {
			const eq = arg.indexOf("=");
			if (eq === -1) flags[arg.slice(2)] = "true";
			else flags[arg.slice(2, eq)] = arg.slice(eq + 1);
		} else {
			positional.push(arg);
		}
	}
	return { positional, flags };
}

async function cmdCreate(positional: string[], flags: Record<string, string>) {
	const name = await resolveName(positional[0]);
	const parent = flags.parent ?? DEFAULT_PARENT;
	const projectDir = process.cwd();
	await loadBaseEnv(flags["base-env"]);
	const neon = requireNeonEnv();
	const reg = await readRegistry();

	const existing = reg[name];
	const port = existing
		? existing.port
		: nextFreePort(reg, flags.port ? Number(flags.port) : undefined);
	const branch = existing?.branch ?? `inst/${name}`;

	// Spin the Neon branch up alongside the container.
	if (await branchExists(branch, neon)) {
		console.log(`🌱 Neon branch '${branch}' already exists — reusing it.`);
	} else {
		console.log(`🌱 Creating Neon branch '${branch}' from '${parent}'...`);
		const code = await createBranch(branch, parent, neon);
		if (code !== 0) {
			console.error(`❌ Failed to create Neon branch '${branch}'.`);
			process.exit(code);
		}
	}

	console.log(`🔌 Fetching connection strings for '${branch}'...`);
	const { pooled, unpooled } = await connectionStrings(branch, neon);

	const baseEnvPath = await resolveBaseEnv(flags["base-env"]);
	const envPath = await generateEnvFile(
		projectDir,
		name,
		port,
		pooled,
		unpooled,
		baseEnvPath,
	);
	console.log(`📝 Wrote ${envPath}`);

	const rec: InstanceRecord = {
		name,
		port,
		branch,
		parent,
		projectDir,
		createdAt: existing?.createdAt ?? new Date().toISOString(),
	};
	reg[name] = rec;
	await writeRegistry(reg);

	console.log(`🐳 Starting container '${project(name)}' on port ${port}...`);
	const code = await compose(rec, ["up", "-d", "--build"]);
	if (code !== 0) process.exit(code);

	console.log(
		`\n✅ Instance '${name}' is up at http://localhost:${port}\n` +
			`   Neon branch: ${branch}  (parent: ${parent})\n` +
			`   Logs: bun run instance:logs ${name}`,
	);
}

async function cmdList() {
	const reg = await readRegistry();
	const records = Object.values(reg);
	if (records.length === 0) {
		console.log("No instances. Create one with: bun run instance:create");
		return;
	}
	console.log("Instances:\n");
	for (const rec of records.sort((a, b) => a.port - b.port)) {
		const { stdout } = await capture([
			"docker",
			"ps",
			"-a",
			"--filter",
			`name=^/rrc-${rec.name}-app$`,
			"--format",
			"{{.Status}}",
		]);
		const status = stdout || "not running";
		console.log(
			`  ${rec.name}\n` +
				`    url:     http://localhost:${rec.port}\n` +
				`    branch:  ${rec.branch} (parent ${rec.parent})\n` +
				`    status:  ${status}\n` +
				`    dir:     ${rec.projectDir}\n`,
		);
	}
}

/** Look up an instance record by resolved name; exit if unknown. */
async function requireRecord(positional: string[]): Promise<InstanceRecord> {
	const name = await resolveName(positional[0]);
	const reg = await readRegistry();
	const rec = reg[name];
	if (!rec) {
		console.error(
			`❌ No instance named '${name}'. Run 'bun run instance:list' to see instances.`,
		);
		process.exit(1);
	}
	return rec;
}

async function cmdLogs(positional: string[]) {
	const rec = await requireRecord(positional);
	await compose(rec, ["logs", "-f"]);
}

async function cmdMigrate(positional: string[]) {
	const rec = await requireRecord(positional);
	console.log(`▶ Applying migrations to '${rec.branch}'...`);
	const code = await compose(rec, [
		"exec",
		"app",
		"sh",
		"-c",
		'DATABASE_URL="$DATABASE_URL_UNPOOLED" bunx --bun prisma migrate deploy',
	]);
	process.exit(code);
}

async function cmdReset(positional: string[]) {
	const rec = await requireRecord(positional);
	await loadBaseEnv();
	const neon = requireNeonEnv();
	console.log(`♻️  Resetting Neon branch '${rec.branch}' to '${rec.parent}'...`);
	const code = await resetBranch(rec.branch, neon);
	if (code !== 0) process.exit(code);
	console.log(
		`✅ '${rec.branch}' re-forked from '${rec.parent}'.\n` +
			`   Run 'bun run instance:migrate ${rec.name}' to re-apply migrations.`,
	);
}

async function cmdDown(positional: string[]) {
	const rec = await requireRecord(positional);
	console.log(`⏸  Stopping '${project(rec.name)}' (Neon branch kept)...`);
	await compose(rec, ["down"]);
	console.log(
		`✅ Paused. Restart with 'bun run instance:create ${rec.name}', ` +
			`or remove fully with 'bun run instance:destroy ${rec.name}'.`,
	);
}

async function cmdDestroy(positional: string[]) {
	const rec = await requireRecord(positional);
	await loadBaseEnv();
	const neon = requireNeonEnv();

	console.log(`🧨 Destroying instance '${rec.name}'...`);
	await compose(rec, ["down", "-v"]);
	console.log(`   ✓ Container + volumes removed`);

	// Remove the per-instance image too (underlying layers stay cached, so a
	// future create still rebuilds fast).
	const image = `rrc-app-dev:${rec.name}`;
	const img = await capture(["docker", "image", "rm", "-f", image]);
	if (img.exitCode === 0) console.log(`   ✓ Image '${image}' removed`);

	const code = await deleteBranch(rec.branch, neon);
	if (code !== 0) {
		console.error(
			`   ⚠️  Failed to delete Neon branch '${rec.branch}' (exit ${code}). Remove it manually.`,
		);
	} else {
		console.log(`   ✓ Neon branch '${rec.branch}' deleted`);
	}

	const envPath = join(rec.projectDir, "docker", "env", `${rec.name}.env`);
	if (await Bun.file(envPath).exists()) {
		await spawn(["rm", "-f", envPath]).exited;
		console.log(`   ✓ Removed ${envPath}`);
	}

	const reg = await readRegistry();
	delete reg[rec.name];
	await writeRegistry(reg);
	console.log(`\n✅ Instance '${rec.name}' destroyed.`);
}

// ── entry ──────────────────────────────────────────────────────────────────

async function main() {
	const [sub, ...rest] = process.argv.slice(2);
	const { positional, flags } = parseFlags(rest);

	switch (sub) {
		case "create":
			return cmdCreate(positional, flags);
		case "list":
			return cmdList();
		case "logs":
			return cmdLogs(positional);
		case "migrate":
			return cmdMigrate(positional);
		case "reset":
			return cmdReset(positional);
		case "stop":
		case "down":
			return cmdDown(positional);
		case "destroy":
			return cmdDestroy(positional);
		default:
			console.error(
				`Usage: bun run scripts/instance.ts <command> [name] [flags]\n\n` +
					`Commands:\n` +
					`  create [name] [--parent main] [--port N] [--base-env path]\n` +
					`  list\n` +
					`  logs [name]\n` +
					`  migrate [name]\n` +
					`  reset [name]\n` +
					`  down|stop [name]\n` +
					`  destroy [name]\n\n` +
					`When [name] is omitted it is derived from the current git branch.`,
			);
			process.exit(sub ? 1 : 0);
	}
}

main();
