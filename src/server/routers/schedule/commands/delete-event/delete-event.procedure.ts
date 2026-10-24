import { deleteEventInputSchema } from "@/schemas";
import { adminProcedure } from "@/server/procedures";
import { deleteEventCommand } from "./delete-event.command";

export const deleteEventProcedure = adminProcedure
	.input(deleteEventInputSchema)
	.mutation(({ ctx, input }) => deleteEventCommand(input, ctx));
