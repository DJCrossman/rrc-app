import { router } from "@/server/trpc";
import { findOrCreateUserAndAthleteByUserIdProcedure } from "./commands/find-or-create-user-and-athlete-by-user-id/find-or-create-user-and-athlete-by-user-id.procedure";
import { updateUserProfileProcedure } from "./commands/update-user-profile/update-user-profile.procedure";
import { getUserByIdProcedure } from "./queries/get-user-by-id/get-user-by-id.procedure";
import { getUserByUserIdProcedure } from "./queries/get-user-by-user-id/get-user-by-user-id.procedure";

export const usersRouter = router({
	getUserById: getUserByIdProcedure,
	getUserByUserId: getUserByUserIdProcedure,
	findOrCreateUserAndAthleteByUserId:
		findOrCreateUserAndAthleteByUserIdProcedure,
	updateUserProfile: updateUserProfileProcedure,
});
