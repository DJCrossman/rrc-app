import z from "zod";
import {
	Concept2Error,
	type Concept2Result,
	concept2ResultSchema,
} from "../types";
import { getConcept2Config } from "../utils";

const commandSchema = z.object({
	searchParams: z.object({
		from: z.string().optional(),
		to: z.string().optional(),
		type: z.enum([
			"rower",
			"skierg",
			"bike",
			"dynamic",
			"slides",
			"paddle",
			"water",
			"snow",
			"rollerski",
			"multierg",
		]),
	}),
	accessToken: z.string(),
});
type Concept2ResultsParams = z.infer<typeof commandSchema>;

const responseSchema = z.object({
	data: z.array(concept2ResultSchema),
	meta: z.object({
		pagination: z.object({
			total: z.number(),
			count: z.number(),
			per_page: z.number(),
			current_page: z.number(),
			total_pages: z.number(),
			links: z.array(z.unknown()),
		}),
	}),
});

export const getConcept2Results = async ({
	accessToken,
	searchParams,
}: Concept2ResultsParams): Promise<PromiseSettledResult<Concept2Result[]>> => {
	const config = getConcept2Config();

	const resultsUrl = new URL(`${config.baseUrl}/api/users/me/results`);
	for (const [key, value] of Object.entries(searchParams)) {
		if (value !== undefined) resultsUrl.searchParams.set(key, value);
	}

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
