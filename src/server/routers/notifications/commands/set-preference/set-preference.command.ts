import type { SetNotificationPreference } from "@/schemas";
import type { AuthenticatedContext } from "@/server/context";

export async function setPreferenceCommand(
	input: SetNotificationPreference,
	{ db, athlete }: AuthenticatedContext,
) {
	const preference = await db.notification_preference.upsert({
		where: { athleteId_scope: { athleteId: athlete.id, scope: input.scope } },
		create: {
			athleteId: athlete.id,
			scope: input.scope,
			enabled: input.enabled,
		},
		update: { enabled: input.enabled },
		select: { scope: true, enabled: true },
	});

	return preference;
}
