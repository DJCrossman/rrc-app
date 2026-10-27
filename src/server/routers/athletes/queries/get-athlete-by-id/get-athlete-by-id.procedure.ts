import { getAthleteByIdInputSchema } from "@/schemas";
import { viewerProcedure } from "@/server/procedures";
import { getAthleteByIdQuery } from "./get-athlete-by-id.query";

export const getAthleteByIdProcedure = viewerProcedure
	.input(getAthleteByIdInputSchema)
	.query(({ ctx, input }) => getAthleteByIdQuery(input, ctx));
