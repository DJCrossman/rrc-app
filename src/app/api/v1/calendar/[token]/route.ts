import { db } from "@/lib/db";
import { getRequestOrigin } from "@/lib/request-origin";
import { getCalendarFeedQuery } from "@/server/routers/schedule/queries/get-calendar-feed/get-calendar-feed.query";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ token: string }> },
) {
	const { token } = await params;
	const calendar = await getCalendarFeedQuery(
		{ token: token.replace(/\.ics$/, ""), origin: getRequestOrigin(request) },
		{ db },
	);
	if (calendar === null) {
		return new Response("Calendar not found", { status: 404 });
	}
	return new Response(calendar, {
		headers: {
			"Content-Type": "text/calendar; charset=utf-8",
			"Content-Disposition": 'inline; filename="regina-rowing-club.ics"',
			"Cache-Control": "private, max-age=300",
		},
	});
}
