import { router } from "@/server/trpc";
import { getConcept2ResultsProcedure } from "./queries/get-concept2-results/get-concept2-results.procedure";
import { getConcept2UserProcedure } from "./queries/get-concept2-user/get-concept2-user.procedure";

export const concept2Router = router({
	getConcept2User: getConcept2UserProcedure,
	getConcept2Results: getConcept2ResultsProcedure,
});
