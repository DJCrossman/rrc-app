#!/usr/bin/env bun

/**
 * Start Ollama Server
 * Simple script to start Ollama in the background
 */

async function checkOllamaService(): Promise<boolean> {
	try {
		const response = await fetch("http://localhost:11434/api/tags");
		return response.ok;
	} catch {
		return false;
	}
}

async function waitForOllama(maxRetries = 30): Promise<boolean> {
	for (let i = 0; i < maxRetries; i++) {
		if (await checkOllamaService()) {
			return true;
		}
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
	return false;
}

async function main() {
	// Check if already running
	if (await checkOllamaService()) {
		console.log("✓ Ollama service already running");
		process.exit(0);
	}

	console.log("🚀 Starting Ollama server...");

	// Start Ollama in background
	const proc = Bun.spawn(["ollama", "serve"], {
		stdout: "ignore",
		stderr: "ignore",
	});

	// Wait for service to be ready
	if (await waitForOllama()) {
		console.log(`✓ Ollama server started (PID: ${proc.pid})`);
	} else {
		console.error("❌ Failed to start Ollama server");
		process.exit(1);
	}
}

main().catch((error) => {
	console.error(`❌ Error: ${error.message}`);
	process.exit(1);
});
