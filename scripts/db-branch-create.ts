#!/usr/bin/env bun

import { connectionStrings, createBranch, requireNeonEnv } from "./lib/neon";

const BRANCH = "develop";
const PARENT = "main";

async function main() {
	const env = requireNeonEnv();

	console.log(`🌱 Creating Neon branch '${BRANCH}' from '${PARENT}'...`);
	const exitCode = await createBranch(BRANCH, PARENT, env);
	if (exitCode !== 0) {
		console.error(
			`\n❌ Failed to create branch. If it already exists, run 'bun run db:branch:reset' instead.`,
		);
		process.exit(exitCode);
	}

	console.log(`\n🔌 Fetching connection strings for '${BRANCH}'...`);
	const { pooled, unpooled } = await connectionStrings(BRANCH, env);

	console.log("\n✅ Branch ready. Paste the following into your .env:\n");
	console.log(`DATABASE_URL=${pooled}`);
	console.log(`DATABASE_URL_UNPOOLED=${unpooled}`);
}

main();
