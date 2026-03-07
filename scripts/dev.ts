#!/usr/bin/env bun

/**
 * Development script that runs Next.js dev server and Ollama in parallel
 */

import { spawn } from "bun";

async function checkOllamaRunning(): Promise<boolean> {
	try {
		const response = await fetch("http://localhost:11434/api/tags");
		return response.ok;
	} catch {
		return false;
	}
}

async function startOllama() {
	if (await checkOllamaRunning()) {
		console.log("✓ Ollama already running");
		return;
	}

	console.log("🚀 Starting Ollama server...");
	spawn(["ollama", "serve"], {
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
	// Start Ollama first
	await startOllama();

	// Start Next.js dev server
	console.log("🚀 Starting Next.js dev server...\n");
	const nextDev = spawn(["next", "dev", "--turbopack"], {
		stdout: "inherit",
		stderr: "inherit",
	});

	// Wait for Next.js process
	await nextDev.exited;
}

main().catch((error) => {
	console.error(`❌ Error: ${error.message}`);
	process.exit(1);
});
