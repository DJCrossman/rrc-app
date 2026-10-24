#!/usr/bin/env bun

/**
 * Shared helpers for driving the Neon CLI (`neonctl`).
 *
 * Used by the single-branch dev scripts (`db-branch-create`, `db-branch-reset`)
 * and by the multi-instance orchestrator (`instance.ts`). Each Neon branch is an
 * isolated fork of the database, so a branch can be created/reset/deleted without
 * touching its parent.
 */

import { spawn } from "bun";

export interface NeonEnv {
	projectId: string;
	apiKey: string;
	orgId: string | undefined;
}

export interface ConnectionStrings {
	pooled: string;
	unpooled: string;
}

/**
 * Read and validate the Neon credentials from the environment. Exits the process
 * with a helpful message if `NEON_PROJECT_ID` or `NEON_API_KEY` are missing.
 */
export function requireNeonEnv(): NeonEnv {
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
	return { projectId, apiKey, orgId };
}

/**
 * Run `neonctl` with the given arguments, automatically appending the project,
 * org, and API key flags. Stdout is captured; stderr is inherited so progress
 * and errors surface to the user.
 */
export async function runNeon(
	args: string[],
	env: NeonEnv,
): Promise<{ stdout: string; exitCode: number }> {
	const orgArgs = env.orgId ? ["--org-id", env.orgId] : [];
	const proc = spawn(
		[
			"bunx",
			"neonctl",
			...args,
			"--project-id",
			env.projectId,
			...orgArgs,
			"--api-key",
			env.apiKey,
		],
		{ stdout: "pipe", stderr: "inherit", env: process.env },
	);
	const stdout = await new Response(proc.stdout).text();
	const exitCode = await proc.exited;
	return { stdout, exitCode };
}

/** Return true if a branch with the given name already exists in the project. */
export async function branchExists(
	name: string,
	env: NeonEnv,
): Promise<boolean> {
	const { stdout, exitCode } = await runNeon(
		["branches", "list", "--output", "json"],
		env,
	);
	if (exitCode !== 0) return false;
	try {
		const branches = JSON.parse(stdout) as Array<{ name?: string }>;
		return branches.some((b) => b.name === name);
	} catch {
		return false;
	}
}

/**
 * Create a branch `name` forked from `parent`. Returns the neonctl exit code so
 * the caller can decide how to handle an "already exists" failure.
 */
export async function createBranch(
	name: string,
	parent: string,
	env: NeonEnv,
): Promise<number> {
	const { exitCode } = await runNeon(
		["branches", "create", "--name", name, "--parent", parent],
		env,
	);
	return exitCode;
}

/** Fetch the pooled + unpooled connection strings for a branch. */
export async function connectionStrings(
	name: string,
	env: NeonEnv,
): Promise<ConnectionStrings> {
	const pooled = await runNeon(
		["connection-string", name, "--pooled"],
		env,
	);
	if (pooled.exitCode !== 0) process.exit(pooled.exitCode);

	const unpooled = await runNeon(["connection-string", name], env);
	if (unpooled.exitCode !== 0) process.exit(unpooled.exitCode);

	return { pooled: pooled.stdout.trim(), unpooled: unpooled.stdout.trim() };
}

/** Reset a branch back on top of its parent (discards branch-local changes). */
export async function resetBranch(name: string, env: NeonEnv): Promise<number> {
	const { exitCode } = await runNeon(
		["branches", "reset", name, "--parent"],
		env,
	);
	return exitCode;
}

/** Delete a branch entirely. */
export async function deleteBranch(name: string, env: NeonEnv): Promise<number> {
	const { exitCode } = await runNeon(["branches", "delete", name], env);
	return exitCode;
}
