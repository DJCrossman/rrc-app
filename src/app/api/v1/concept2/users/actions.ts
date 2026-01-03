import z from "zod";
import { Concept2Error, type Concept2User, concept2UserSchema } from "../types";
import { getConcept2Config } from "../utils";

const commandSchema = z.object({
	accessToken: z.string(),
});
type Concept2UserParams = z.infer<typeof commandSchema>;

const responseSchema = z.object({
	data: concept2UserSchema,
});

export const getConcept2User = async ({
	accessToken,
}: Concept2UserParams): Promise<PromiseSettledResult<Concept2User>> => {
	const config = getConcept2Config();

	const resultsUrl = new URL(`${config.baseUrl}/api/users/me`);
	const resultsResponse = await fetch(resultsUrl.toString(), {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: "application/json",
		},
	});

	if (!resultsResponse.ok) {
		const errorText = await resultsResponse.text();
		console.error(
			"Failed to fetch results:",
			resultsResponse.status,
			errorText,
		);

		if (resultsResponse.status === 401) {
			return {
				status: "rejected",
				reason: new Concept2Error({
					message: "Authentication required",
					auth_url: "/api/v1/concept2/auth",
					status: 401,
				}),
			};
		}
	}

	const parsedResponse = await responseSchema.safeParseAsync(
		await resultsResponse.json(),
	);

	if (!parsedResponse.success) {
		console.error("Invalid results response:", parsedResponse.error);
		return {
			status: "rejected",
			reason: new Concept2Error({
				message: "Failed to fetch results from Concept2",
				status: 500,
			}),
		};
	}

	return {
		status: "fulfilled",
		value: parsedResponse.data.data,
	};
};
