#!/usr/bin/env bun

import { spawn } from "bun";

const BRANCH = "develop";
const PARENT = "main";

async function run(
	args: string[],
	apiKey: string,
	orgId: string | undefined,
): Promise<{ stdout: string; exitCode: number }> {
	const orgArgs = orgId ? ["--org-id", orgId] : [];
	const proc = spawn(
		["bunx", "neonctl", ...args, ...orgArgs, "--api-key", apiKey],
		{
			stdout: "pipe",
			stderr: "inherit",
			env: process.env,
		},
	);
	const stdout = await new Response(proc.stdout).text();
	const exitCode = await proc.exited;
	return { stdout, exitCode };
}

async function main() {
	const projectId = process.env.NEON_PROJECT_ID;
	const apiKey = process.env.NEON_API_KEY;
	const orgId = process.env.NEON_ORG_ID;
	if (!projectId) {
		console.error("❌ NEON_PROJECT_ID is not set. Add it to your .env file.");
		process.exit(1);
	}
	if (!apiKey) {
		console.error("❌ NEON_API_KEY is not set. Add it to your .env file.");
		process.exit(1);
	}

	console.log(`🌱 Creating Neon branch '${BRANCH}' from '${PARENT}'...`);
	const create = await run(
		[
			"branches",
			"create",
			"--name",
			BRANCH,
			"--parent",
			PARENT,
			"--project-id",
			projectId,
		],
		apiKey,
		orgId,
	);

	if (create.exitCode !== 0) {
		console.error(
			`\n❌ Failed to create branch. If it already exists, run 'bun run db:branch:reset' instead.`,
		);
		process.exit(create.exitCode);
	}
	process.stdout.write(create.stdout);

	console.log(`\n🔌 Fetching connection strings for '${BRANCH}'...`);

	const pooled = await run(
		["connection-string", BRANCH, "--project-id", projectId, "--pooled"],
		apiKey,
		orgId,
	);
	if (pooled.exitCode !== 0) process.exit(pooled.exitCode);

	const unpooled = await run(
		["connection-string", BRANCH, "--project-id", projectId],
		apiKey,
		orgId,
	);
	if (unpooled.exitCode !== 0) process.exit(unpooled.exitCode);

	console.log("\n✅ Branch ready. Paste the following into your .env:\n");
	console.log(`DATABASE_URL=${pooled.stdout.trim()}`);
	console.log(`DATABASE_URL_UNPOOLED=${unpooled.stdout.trim()}`);
}

main();
