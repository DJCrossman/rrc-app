import { generateText } from "ai";
import { createOllama } from "ollama-ai-provider-v2";
import { envVars } from "../env";

/**
 * Generates text from a prompt using Ollama.
 * @param prompt - The text prompt
 * @returns Raw text response from the model
 */
export async function generateTextFromPrompt({
	prompt,
}: {
	prompt: string;
}): Promise<string> {
	const ollama = createOllama({
		baseURL: envVars.OLLAMA_HOST,
		headers: {
			Authorization: `Bearer ${envVars.OLLAMA_API_KEY}`,
		},
	});

	const result = await generateText({
		model: ollama(envVars.OLLAMA_MODEL),
		messages: [
			{
				role: "user",
				content: [{ type: "text", text: prompt }],
			},
		],
		temperature: 0.1,
		abortSignal: AbortSignal.timeout(30000),
	});

	return result.text;
}
