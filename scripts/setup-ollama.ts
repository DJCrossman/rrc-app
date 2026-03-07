#!/usr/bin/env bun

/**
 * Ollama Setup Script for M2 Max
 * This script automates the installation and configuration of Ollama
 * for optimal performance on Apple Silicon (M2 Max)
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { arch, platform } from "node:os";
import { $ } from "bun";

// ANSI color codes
const colors = {
	red: "\x1b[0;31m",
	green: "\x1b[0;32m",
	yellow: "\x1b[1;33m",
	reset: "\x1b[0m",
};

function log(message: string, color?: keyof typeof colors) {
	const colorCode = color ? colors[color] : "";
	const reset = color ? colors.reset : "";
	console.log(`${colorCode}${message}${reset}`);
}

function logSuccess(message: string) {
	log(`✓ ${message}`, "green");
}

function logWarning(message: string) {
	log(`⚠️  ${message}`, "yellow");
}

function logError(message: string) {
	log(`❌ ${message}`, "red");
}

async function commandExists(command: string): Promise<boolean> {
	try {
		await $`command -v ${command}`.quiet();
		return true;
	} catch {
		return false;
	}
}

async function main() {
	console.log("🚀 Setting up Ollama for M2 Max Performance");
	console.log("==============================================\n");

	// Check if running on macOS
	if (platform() !== "darwin") {
		logError("Error: This script is for macOS only");
		process.exit(1);
	}

	// Check if running on Apple Silicon
	if (arch() !== "arm64") {
		logWarning(
			"Warning: This script is optimized for Apple Silicon (M1/M2/M3)",
		);
		console.log("   You may not get optimal performance on Intel Macs.");

		const proceed = prompt("   Continue anyway? (y/n) ");
		if (proceed?.toLowerCase() !== "y") {
			process.exit(0);
		}
	}

	// Step 1: Check/Install Homebrew
	console.log("📦 Checking for Homebrew...");
	if (!(await commandExists("brew"))) {
		logWarning("Homebrew not found. Installing...");
		await $`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`;

		// Add Homebrew to PATH for Apple Silicon
		if (existsSync("/opt/homebrew/bin/brew")) {
			process.env.PATH = `/opt/homebrew/bin:${process.env.PATH}`;
		}
	} else {
		logSuccess("Homebrew already installed");
	}
	console.log();

	// Step 2: Install Ollama
	console.log("🤖 Checking for Ollama...");
	if (!(await commandExists("ollama"))) {
		logWarning("Ollama not found. Installing...");
		await $`brew install ollama`;
		logSuccess("Ollama installed successfully");
	} else {
		logSuccess("Ollama already installed");
		try {
			const version = await $`ollama --version`.text();
			console.log(`   Version: ${version.trim()}`);
		} catch {
			console.log("   Version: unknown");
		}
	}
	console.log();

	// Step 3: Pull llava:13b model
	console.log("📥 Checking for llava:13b model...");
	const modelList = await $`ollama list`.text();
	if (modelList.includes("llava:13b")) {
		logSuccess("llava:13b model already downloaded");
		const lines = modelList.split("\n");
		const llavaLine = lines.find((line) => line.includes("llava:13b"));
		if (llavaLine) {
			const size = llavaLine.split(/\s+/)[1];
			console.log(`   Size: ${size}`);
		}
	} else {
		logWarning("llava:13b model not found. Downloading...");
		console.log(
			"   This will download approximately 8GB. Please be patient...",
		);
		await $`ollama pull llava:13b`;
		logSuccess("llava:13b model downloaded successfully");
	}
	console.log();

	// Step 4: Create custom optimized model from Modelfile
	console.log("⚙️  Creating optimized model for M2 Max...");
	if (existsSync("Modelfile")) {
		const modelListCheck = await $`ollama list`.text();
		if (modelListCheck.includes("llava-m2max")) {
			logWarning("llava-m2max model already exists");
			const recreate = prompt("   Recreate it? (y/n) ");
			if (recreate?.toLowerCase() === "y") {
				try {
					await $`ollama rm llava-m2max`.quiet();
				} catch {
					// Model might not exist
				}
				await $`ollama create llava-m2max -f Modelfile`;
				logSuccess("llava-m2max model recreated");
			} else {
				console.log("   Skipping model creation");
			}
		} else {
			await $`ollama create llava-m2max -f Modelfile`;
			logSuccess("llava-m2max model created with M2 Max optimizations");
		}
	} else {
		logWarning("Modelfile not found. Skipping custom model creation");
		console.log("   You can still use llava:13b directly");
	}
	console.log();

	// Display next steps
	logSuccess("✅ Ollama setup complete!\n");
	console.log("📝 Next Steps:");
	console.log(
		"   1. Start Ollama: bun run start:ollama (or it will auto-start with 'bun dev')",
	);
	console.log("   2. Configure .env if needed (see .env.example)");
	console.log("   3. Run: bun dev\n");

	console.log("🔧 Useful Commands:");
	console.log("   • Check running models: ollama ps");
	console.log("   • List all models: ollama list");
	console.log(
		"   • Test model: ollama run llava:13b 'Describe this image' --image <path>",
	);
	console.log("   • Stop Ollama: pkill ollama");
	console.log("   • View Ollama logs: tail -f /tmp/ollama.log\n");

	// Optional: Ask if user wants to use the optimized model by default
	const checkModelList = await $`ollama list`.text();
	if (checkModelList.includes("llava-m2max")) {
		const useOptimized = prompt(
			"🎯 Use llava-m2max (optimized) as default model in .env? (y/n) ",
		);
		if (useOptimized?.toLowerCase() === "y") {
			if (existsSync(".env")) {
				let envContent = readFileSync(".env", "utf-8");

				if (envContent.includes("OLLAMA_MODEL=")) {
					// Replace existing
					envContent = envContent.replace(
						/^OLLAMA_MODEL=.*/m,
						"OLLAMA_MODEL=llava-m2max",
					);
					logSuccess("Updated .env: OLLAMA_MODEL=llava-m2max");
				} else if (envContent.includes("# OLLAMA_MODEL=")) {
					// Uncomment and set
					envContent = envContent.replace(
						/^# OLLAMA_MODEL=.*/m,
						"OLLAMA_MODEL=llava-m2max",
					);
					logSuccess("Added to .env: OLLAMA_MODEL=llava-m2max");
				} else {
					// Add new line
					envContent += "\nOLLAMA_MODEL=llava-m2max\n";
					logSuccess("Added to .env: OLLAMA_MODEL=llava-m2max");
				}

				writeFileSync(".env", envContent, "utf-8");
			} else {
				logWarning(
					".env file not found. Please set OLLAMA_MODEL=llava-m2max manually",
				);
			}
		}
	}

	console.log();
	logSuccess("🎉 All done! Happy coding!");
}

main().catch((error) => {
	logError(`Unexpected error: ${error.message}`);
	process.exit(1);
});
