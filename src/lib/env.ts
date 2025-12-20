import z from "zod";

export const envVars = z
	.object({
		NEXT_PUBLIC_HOME_URL: z.url().default("https://www.reginarowing.com/"),
		NEXT_PUBLIC_AI_ENABLED: z
			.string()
			.transform((val) => val === "true")
			.default(false),
		C2_CLIENT_ID: z.string().optional(),
		C2_CLIENT_SECRET: z.string().optional(),
		OLLAMA_HOST: z.url().default("http://localhost:11434/api"),
		OLLAMA_MODEL: z.string().default("qwen3-vl:235b"),
		OLLAMA_API_KEY: z.string().optional(),
	})
	.parse(process.env);
