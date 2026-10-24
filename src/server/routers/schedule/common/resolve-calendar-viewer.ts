import { isDefaultOrgAdmin } from "@/server/clerk/default-organization";
import type { Context } from "@/server/context";

export async function resolveCalendarViewer(
	db: Context["db"],
	token: string,
): Promise<{ userId: string; athleteId: string | null } | null> {
	const calendarToken = await db.calendar_token.findUnique({
		where: { token },
		select: { userId: true },
	});
	if (!calendarToken) {
		return null;
	}
	const { userId } = calendarToken;
	const athlete = await db.athlete.findUnique({
		where: { userId },
		select: { id: true },
	});
	if (athlete) {
		return { userId, athleteId: athlete.id };
	}
	const isAdmin = await isDefaultOrgAdmin(userId).catch(() => false);
	return isAdmin ? { userId, athleteId: null } : null;
}
