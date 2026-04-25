#!/usr/bin/env bun

import { spawn } from "bun";

const BRANCH = "develop";

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

	console.log(`♻️  Resetting Neon branch '${BRANCH}' to its parent...`);
	const orgArgs = orgId ? ["--org-id", orgId] : [];
	const proc = spawn(
		[
			"bunx",
			"neonctl",
			"branches",
			"reset",
			BRANCH,
			"--parent",
			"--project-id",
			projectId,
			...orgArgs,
			"--api-key",
			apiKey,
		],
		{ stdout: "inherit", stderr: "inherit", env: process.env },
	);

	const exitCode = await proc.exited;
	if (exitCode !== 0) {
		console.error(`\n❌ Reset failed (exit ${exitCode}).`);
		process.exit(exitCode);
	}

	console.log(
		`\n✅ '${BRANCH}' is now aligned with its parent. Connection strings are unchanged.`,
	);
}

main();
