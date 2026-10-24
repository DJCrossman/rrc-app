import type { Context } from "@/server/context";
import type { CalendarReplyStatus } from "@/server/routers/schedule/common/calendar-reply";
import { setRsvp } from "@/server/routers/schedule/common/set-rsvp";
import { getCalendarReplyQuery } from "@/server/routers/schedule/queries/get-calendar-reply/get-calendar-reply.query";

export async function replyFromCalendarCommand(
	{
		token,
		eventId,
		status,
	}: { token: string; eventId: string; status: CalendarReplyStatus },
	{ db }: Pick<Context, "db">,
) {
	const reply = await getCalendarReplyQuery({ token, eventId }, { db });
	if (!reply) {
		return null;
	}
	const { status: saved } = await setRsvp(db, {
		eventId,
		athleteId: reply.athleteId,
		status: status === "none" ? null : status,
	});
	return { ...reply, status: saved };
}
