import { updateEventSchema } from "@/schemas";
import { adminProcedure } from "@/server/procedures";
import { updateEventCommand } from "./update-event.command";

export const updateEventProcedure = adminProcedure
	.input(updateEventSchema)
	.mutation(({ ctx, input }) => updateEventCommand(input, ctx));
