import { getEventByIdInputSchema } from "@/schemas";
import { viewerProcedure } from "@/server/procedures";
import { getEventByIdQuery } from "./get-event-by-id.query";

export const getEventByIdProcedure = viewerProcedure
	.input(getEventByIdInputSchema)
	.query(({ ctx, input }) => getEventByIdQuery(input, ctx));
