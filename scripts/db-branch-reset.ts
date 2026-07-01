#!/usr/bin/env bun

import { requireNeonEnv, resetBranch } from "./lib/neon";

const BRANCH = "develop";

async function main() {
	const env = requireNeonEnv();

	console.log(`♻️  Resetting Neon branch '${BRANCH}' to its parent...`);
	const exitCode = await resetBranch(BRANCH, env);
	if (exitCode !== 0) {
		console.error(`\n❌ Reset failed (exit ${exitCode}).`);
		process.exit(exitCode);
	}

	console.log(
		`\n✅ '${BRANCH}' is now aligned with its parent. Connection strings are unchanged.`,
	);
}

main();
