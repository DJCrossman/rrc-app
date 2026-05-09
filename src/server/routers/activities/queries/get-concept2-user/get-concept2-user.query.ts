import { Concept2Error } from "@/app/api/v1/concept2/types";
import type { Concept2User } from "@/schemas";
import type { AuthenticatedContext } from "@/server/context";
import { getConcept2AccessToken } from "../../common/get-concept2-access-token";

export async function getConcept2UserQuery(
	_input: undefined,
	ctx: AuthenticatedContext,
): Promise<PromiseSettledResult<Concept2User>> {
	const accessToken = await getConcept2AccessToken(ctx);
	if (!accessToken) {
		return {
			status: "rejected",
			reason: new Concept2Error({
				message: "Concept2 not connected",
				auth_url: "/api/v1/concept2/auth",
				status: 401,
			}),
		};
	}
	return ctx.services.concept2.fetchUser(accessToken);
}
