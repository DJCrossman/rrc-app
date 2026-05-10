import { router } from "@/server/trpc";
import { completeOnboardingProcedure } from "./commands/complete-onboarding/complete-onboarding.procedure";
import { updateUserProfileProcedure } from "./commands/update-user-profile/update-user-profile.procedure";
import { getCurrentUserProcedure } from "./queries/get-current-user/get-current-user.procedure";
import { getUserByIdProcedure } from "./queries/get-user-by-id/get-user-by-id.procedure";
import { getUserByUserIdProcedure } from "./queries/get-user-by-user-id/get-user-by-user-id.procedure";

export const usersRouter = router({
	getCurrentUser: getCurrentUserProcedure,
	getUserById: getUserByIdProcedure,
	getUserByUserId: getUserByUserIdProcedure,
	updateUserProfile: updateUserProfileProcedure,
	completeOnboarding: completeOnboardingProcedure,
});
