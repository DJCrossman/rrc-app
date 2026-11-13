import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL;
if (!baseURL) {
	throw new Error(
		"E2E_BASE_URL is not set. Run the suite against a dummy instance with `bun run instance:e2e`.",
	);
}

export default defineConfig({
	testDir: "e2e",
	outputDir: "e2e/.output",
	use: {
		baseURL,
		headless: true,
	},
	projects: [
		{
			name: "desktop",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 1280, height: 800 },
				video: { mode: "on", size: { width: 1280, height: 800 } },
			},
		},
		{
			name: "phone",
			use: {
				...devices["Pixel 7"],
				viewport: { width: 390, height: 844 },
				video: { mode: "on", size: { width: 390, height: 844 } },
			},
		},
	],
});
