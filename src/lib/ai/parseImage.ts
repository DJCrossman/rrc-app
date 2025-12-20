import { generateText } from "ai";
import { createOllama } from "ollama-ai-provider-v2";
import { envVars } from "../env";

/**
 * Parses an image using Ollama's vision model with a prompt.
 * @param imageBase64 - Base64 encoded image string
 * @param prompt - Prompt with instructions and schema
 * @returns Raw text response from the model
 */
export async function parseImage({
	imageBase64,
	prompt,
}: {
	imageBase64: string;
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
				content: [
					{ type: "text", text: prompt },
					{
						type: "image",
						image: imageBase64,
					},
				],
			},
		],
	});

	return result.text;
}
