import { rsvpInputSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { rsvpCommand } from "./rsvp.command";

export const rsvpProcedure = protectedProcedure
	.input(rsvpInputSchema)
	.mutation(({ ctx, input }) => rsvpCommand(input, ctx));
