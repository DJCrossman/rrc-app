import z from "zod";

// if window exists it should be undefined or the passed in value
const zServerOnly = <T extends z.ZodTypeAny>(schema: T) =>
	z.union([schema, z.undefined()]).refine((val) => {
		if (typeof window === "undefined") {
			return val !== undefined;
		}
		return true;
	}, "This variable is only available on the server");

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
		OLLAMA_MODEL: z.string().default("llava:13b"),
		OLLAMA_API_KEY: z.string().optional(),
		SIGNUP_CODE: z.string().optional(),
		NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID: z.string(),
		DATABASE_URL: zServerOnly(z.string()),
	})
	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	.parse({
		NEXT_PUBLIC_HOME_URL: process.env.NEXT_PUBLIC_HOME_URL,
		NEXT_PUBLIC_AI_ENABLED: process.env.NEXT_PUBLIC_AI_ENABLED,
		C2_CLIENT_ID: process.env.C2_CLIENT_ID,
		C2_CLIENT_SECRET: process.env.C2_CLIENT_SECRET,
		OLLAMA_HOST: process.env.OLLAMA_HOST,
		OLLAMA_MODEL: process.env.OLLAMA_MODEL,
		OLLAMA_API_KEY: process.env.OLLAMA_API_KEY,
		SIGNUP_CODE: process.env.SIGNUP_CODE,
		NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID:
			process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID,
		DATABASE_URL: process.env.DATABASE_URL,
	});
