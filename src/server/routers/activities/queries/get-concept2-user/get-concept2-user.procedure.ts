import { protectedProcedure } from "@/server/procedures";
import { getConcept2UserQuery } from "./get-concept2-user.query";

export const getConcept2UserProcedure = protectedProcedure.query(({ ctx }) =>
	getConcept2UserQuery(undefined, ctx),
);
