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

import { basename, isAbsolute, join, resolve } from "node:path";
import { spawn } from "bun";
import {
	DUMMY_ORGANIZATION_ID,
	E2E_ADMIN_USER_ID,
	E2E_MEMBER_USER_ID,
	replaceWithDummyData,
} from "./lib/dummy-data";
import {
	branchExists,
	connectionStrings,
	createBranch,
	deleteBranch,
	type NeonEnv,
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
	dummy?: boolean;
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
			console.error(
				`❌ Port ${requested} is already used by another instance.`,
			);
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
	dummy: boolean,
): Promise<string> {
	const base = parseEnv(await Bun.file(baseEnvPath).text());

	// Override the per-instance values.
	base.set("DATABASE_URL", pooled);
	base.set("DATABASE_URL_UNPOOLED", unpooled);
	if (dummy) {
		// Served inside the container by docker/dev-entrypoint.sh (scripts/clerk-emulator.ts).
		base.set("CLERK_API_URL", "http://127.0.0.1:4011");
		base.set("CLERK_SECRET_KEY", "sk_test_emulator");
		base.set(
			"NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
			`pk_test_${btoa("127.0.0.1:4011$")}`,
		);
		base.set("NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID", DUMMY_ORGANIZATION_ID);
	}
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

async function compose(rec: InstanceRecord, args: string[]): Promise<number> {
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
	const dummy = flags.dummy === "true" || existing?.dummy === true;

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
	if (dummy) await replaceBranchWithDummyData(branch, unpooled, neon);
	const envPath = await generateEnvFile(
		projectDir,
		name,
		port,
		pooled,
		unpooled,
		baseEnvPath,
		dummy,
	);
	console.log(`📝 Wrote ${envPath}`);

	const rec: InstanceRecord = {
		name,
		port,
		branch,
		parent,
		projectDir,
		createdAt: existing?.createdAt ?? new Date().toISOString(),
		...(dummy && { dummy: true }),
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

/**
 * Migrate the instance's branch, then swap every row in it for invented data so
 * no real member ever shows up in a demo or an e2e run. Exits on any failure.
 */
async function replaceBranchWithDummyData(
	branch: string,
	unpooled: string,
	neon: NeonEnv,
) {
	const main = await connectionStrings("main", neon);
	const mainHosts = [main.pooled, main.unpooled].map(
		(url) => new URL(url).host,
	);
	const targetHost = new URL(unpooled).host;
	if (!branch.startsWith("inst/") || mainHosts.includes(targetHost)) {
		console.error(
			`❌ Refusing to wipe '${branch}' (host ${targetHost}): only an inst/ branch that is not on main's host can hold dummy data.`,
		);
		process.exit(1);
	}

	console.log(`▶ Applying migrations to '${branch}'...`);
	const migrateCode = await inherit(
		["bunx", "--bun", "prisma", "migrate", "deploy"],
		{ env: { DATABASE_URL: unpooled } },
	);
	if (migrateCode !== 0) process.exit(migrateCode);

	console.log(`🧹 Replacing every row on '${branch}' with dummy data...`);
	try {
		await replaceWithDummyData(unpooled);
	} catch (error) {
		console.error(
			`❌ Failed to fill '${branch}' with dummy data: ${error instanceof Error ? error.message : error}`,
		);
		process.exit(1);
	}
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
	if (rec.dummy) {
		console.log(
			`⏸  Stopping '${project(rec.name)}' so it never serves the re-forked data...`,
		);
		await compose(rec, ["down"]);
	}
	const code = await resetBranch(rec.branch, neon);
	if (code !== 0) process.exit(code);
	if (rec.dummy) {
		const { unpooled } = await connectionStrings(rec.branch, neon);
		await replaceBranchWithDummyData(rec.branch, unpooled, neon);
		const upCode = await compose(rec, ["up", "-d"]);
		if (upCode !== 0) process.exit(upCode);
		console.log(
			`✅ '${rec.branch}' re-forked from '${rec.parent}', migrated and refilled with dummy data.`,
		);
		return;
	}
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

async function cmdE2e(playwrightArgs: string[]) {
	const name = await resolveName();
	const rec = (await readRegistry())[name];
	if (!rec?.dummy) {
		console.error(
			`❌ e2e only runs against a dummy instance, and '${name}' ${rec ? "is not one" : "does not exist"}.\n` +
				`   Create one with: bun run instance:create --dummy`,
		);
		process.exit(1);
	}
	// The emulator's signing key only lives in the container, so mint there.
	const mint = spawn(
		[
			"docker",
			"compose",
			"-p",
			project(rec.name),
			"exec",
			"-T",
			"app",
			"bun",
			"-e",
			`const headers = { Authorization: "Bearer " + process.env.CLERK_SECRET_KEY, "Content-Type": "application/json" };
			const sessions = await Promise.all(${JSON.stringify([E2E_ADMIN_USER_ID, E2E_MEMBER_USER_ID])}.map(async (user_id) => {
				const session = await fetch(process.env.CLERK_API_URL + "/v1/sessions", { method: "POST", headers, body: JSON.stringify({ user_id }) }).then((r) => r.json());
				const token = await fetch(process.env.CLERK_API_URL + "/v1/sessions/" + session.id + "/tokens", { method: "POST", headers }).then((r) => r.json());
				return token.jwt;
			}));
			if (!sessions.every(Boolean)) process.exit(1);
			console.log(sessions.join(" "));`,
		],
		{
			stdout: "pipe",
			stderr: "inherit",
			cwd: rec.projectDir,
			env: { ...process.env, ...composeEnv(rec) },
		},
	);
	const [adminSession, memberSession] = (await new Response(mint.stdout).text())
		.trim()
		.split(" ");
	if ((await mint.exited) !== 0 || !memberSession) {
		console.error(
			`❌ Could not mint e2e sessions in '${project(rec.name)}'. Is it running? Start it with: bun run instance:create`,
		);
		process.exit(1);
	}
	const code = await inherit(
		["bunx", "playwright", "test", ...playwrightArgs],
		{
			env: {
				E2E_BASE_URL: `http://localhost:${rec.port}`,
				E2E_ADMIN_SESSION: adminSession,
				E2E_MEMBER_SESSION: memberSession,
			},
		},
	);
	process.exit(code);
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
		case "e2e":
			return cmdE2e(rest);
		default:
			console.error(
				`Usage: bun run scripts/instance.ts <command> [name] [flags]\n\n` +
					`Commands:\n` +
					`  create [name] [--parent main] [--port N] [--base-env path] [--dummy]\n` +
					`  list\n` +
					`  logs [name]\n` +
					`  migrate [name]\n` +
					`  reset [name]\n` +
					`  down|stop [name]\n` +
					`  destroy [name]\n` +
					`  e2e [playwright args]   (dummy instances only)\n\n` +
					`When [name] is omitted it is derived from the current git branch.`,
			);
			process.exit(sub ? 1 : 0);
	}
}

main();
