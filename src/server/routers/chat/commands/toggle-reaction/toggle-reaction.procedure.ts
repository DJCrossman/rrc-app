import { toggleReactionSchema } from "@/schemas/chat.schema";
import { viewerProcedure } from "@/server/procedures";
import { toggleReactionCommand } from "./toggle-reaction.command";

export const toggleReactionProcedure = viewerProcedure
	.input(toggleReactionSchema)
	.mutation(({ ctx, input }) => toggleReactionCommand(input, ctx));
