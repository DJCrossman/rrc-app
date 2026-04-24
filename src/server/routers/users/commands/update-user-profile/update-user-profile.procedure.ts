import { updateAthleteSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { updateUserProfileCommand } from "./update-user-profile.command";

export const updateUserProfileProcedure = protectedProcedure
	.input(updateAthleteSchema)
	.mutation(({ ctx, input }) => updateUserProfileCommand(input, ctx));
