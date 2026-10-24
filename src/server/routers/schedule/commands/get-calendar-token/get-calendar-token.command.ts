import type { ViewerContext } from "@/server/context";
import { generateCalendarToken } from "@/server/routers/schedule/common/calendar-token";

export async function getCalendarTokenCommand(
	_input: undefined,
	{ db, user }: ViewerContext,
) {
	const { token } = await db.calendar_token.upsert({
		where: { userId: user.id },
		create: { userId: user.id, token: generateCalendarToken() },
		update: {},
	});
	return { token };
}
