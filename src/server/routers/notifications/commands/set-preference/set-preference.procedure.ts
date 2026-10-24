import { setNotificationPreferenceSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { setPreferenceCommand } from "./set-preference.command";

export const setPreferenceProcedure = protectedProcedure
	.input(setNotificationPreferenceSchema)
	.mutation(({ ctx, input }) => setPreferenceCommand(input, ctx));
