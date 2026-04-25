import { getConcept2UserInputSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { getConcept2UserQuery } from "./get-concept2-user.query";

export const getConcept2UserProcedure = protectedProcedure
	.input(getConcept2UserInputSchema)
	.query(({ ctx, input }) => getConcept2UserQuery(input, ctx));
