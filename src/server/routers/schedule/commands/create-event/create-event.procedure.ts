import { createEventSchema } from "@/schemas";
import { adminProcedure } from "@/server/procedures";
import { createEventCommand } from "./create-event.command";

export const createEventProcedure = adminProcedure
	.input(createEventSchema)
	.mutation(({ ctx, input }) => createEventCommand(input, ctx));
