import { athleteProfileSchema } from "@/schemas";
import { authenticatedProcedure } from "@/server/common/procedures/authenticated.procedure";
import { updateUserProfileCommand } from "./update-user-profile.command";

export const updateUserProfileProcedure = authenticatedProcedure
	.input(athleteProfileSchema)
	.mutation(({ ctx, input }) => updateUserProfileCommand(input, ctx));
