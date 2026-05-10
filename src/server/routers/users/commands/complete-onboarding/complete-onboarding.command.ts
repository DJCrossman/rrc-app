import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import type { CompleteOnboarding } from "@/schemas";
import type { OnboardingContext } from "@/server/common/context";
import { mapToAthleteDto } from "@/server/routers/athletes/common/map-to-athlete-dto";

export async function completeOnboardingCommand(
	input: CompleteOnboarding,
	{ db, user }: OnboardingContext,
) {
	const client = await clerkClient();
	const clerkUser = await client.users.getUser(user.id);
	const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;

	if (email) {
		const existingByEmail = await db.athlete.findUnique({ where: { email } });
		if (existingByEmail) {
			throw new TRPCError({
				code: "CONFLICT",
				message:
					"An athlete with your email already exists; please contact a club admin to link it.",
			});
		}
	}

	const athlete = await db.athlete.create({
		data: {
			userId: user.id,
			firstName: input.firstName,
			lastName: input.lastName,
			nickname: input.nickname,
			email,
			phone: input.phone,
			gender: input.gender,
			dateOfBirth: new Date(input.dateOfBirth),
			heightInCm: input.heightInCm ?? null,
			weightInKg: input.weightInKg ?? null,
			dateJoined: new Date(),
			role: user.isAdmin ? "admin" : "member",
		},
		include: { memberships: { include: { program: true } } },
	});

	return mapToAthleteDto(athlete);
}
