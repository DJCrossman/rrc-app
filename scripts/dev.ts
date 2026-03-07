#!/usr/bin/env bun

/**
 * Development script that runs Next.js dev server and Ollama in parallel
 */

import type { Subprocess } from "bun";
import { spawn } from "bun";

let ollamaProcess: Subprocess | null = null;
let nextDevProcess: Subprocess | null = null;
let ollamaWasStartedByUs = false;

async function checkOllamaRunning(): Promise<boolean> {
	try {
		const response = await fetch("http://localhost:11434/api/tags");
		return response.ok;
	} catch {
		return false;
	}
}

async function cleanup() {
	console.log("\n🛑 Shutting down development servers...");

	// Kill Next.js dev server
	if (nextDevProcess && !nextDevProcess.killed) {
		nextDevProcess.kill();
		console.log("✓ Stopped Next.js dev server");
	}

	// Only kill Ollama if we started it
	if (ollamaWasStartedByUs && ollamaProcess && !ollamaProcess.killed) {
		ollamaProcess.kill();
		console.log("✓ Stopped Ollama server");
	}

	process.exit(0);
}

async function startOllama() {
	if (await checkOllamaRunning()) {
		console.log("✓ Ollama already running");
		return;
	}

	console.log("🚀 Starting Ollama server...");
	ollamaWasStartedByUs = true;
	ollamaProcess = spawn(["ollama", "serve"], {
		stdout: "inherit",
		stderr: "inherit",
	});

	// Wait a moment for Ollama to start
	await new Promise((resolve) => setTimeout(resolve, 2000));

	if (await checkOllamaRunning()) {
		console.log("✓ Ollama server started\n");
	}
}

async function main() {
	// Set up signal handlers for clean shutdown
	process.on("SIGINT", cleanup);
	process.on("SIGTERM", cleanup);

	// Start Ollama first
	await startOllama();

	// Start Next.js dev server
	console.log("🚀 Starting Next.js dev server...\n");
	nextDevProcess = spawn(["next", "dev", "--turbopack"], {
		stdout: "inherit",
		stderr: "inherit",
	});

	// Wait for Next.js process
	await nextDevProcess.exited;

	// If Next.js exits on its own, clean up
	await cleanup();
}

main().catch((error) => {
	console.error(`❌ Error: ${error.message}`);
	process.exit(1);
});
