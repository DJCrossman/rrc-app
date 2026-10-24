import { TRPCError } from "@trpc/server";
import { db } from "@/lib/db";
import { replyFromCalendarCommand } from "@/server/routers/schedule/commands/reply-from-calendar/reply-from-calendar.command";
import {
	describeReply,
	parseCalendarReplyStatus,
} from "@/server/routers/schedule/common/calendar-reply";
import { renderCalendarReplyPage } from "@/server/routers/schedule/common/calendar-reply-page";
import { getCalendarReplyQuery } from "@/server/routers/schedule/queries/get-calendar-reply/get-calendar-reply.query";

type RouteContext = { params: Promise<{ token: string; eventId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
	const { token, eventId } = await params;
	const reply = await getCalendarReplyQuery({ token, eventId }, { db });
	if (!reply) {
		return htmlResponse(notFoundPage(), 404);
	}
	return htmlResponse(
		renderCalendarReplyPage({
			title: reply.event.title,
			subtitle: reply.event.subtitle,
			message: `Your reply: ${describeReply(reply.event.type, reply.status)}`,
			type: reply.event.type,
			highlight: parseCalendarReplyStatus(
				new URL(request.url).searchParams.get("status"),
			),
		}),
	);
}

export async function POST(request: Request, { params }: RouteContext) {
	const { token, eventId } = await params;
	const status = parseCalendarReplyStatus(
		(await request.formData()).get("status"),
	);
	if (!status) {
		return htmlResponse(notFoundPage(), 400);
	}
	try {
		const reply = await replyFromCalendarCommand(
			{ token, eventId, status },
			{ db },
		);
		if (!reply) {
			return htmlResponse(notFoundPage(), 404);
		}
		return htmlResponse(
			renderCalendarReplyPage({
				title: reply.event.title,
				subtitle: reply.event.subtitle,
				message: `Saved. Your reply: ${describeReply(reply.event.type, reply.status)}`,
				type: reply.event.type,
			}),
		);
	} catch (error) {
		if (!(error instanceof TRPCError)) {
			throw error;
		}
		const reply = await getCalendarReplyQuery({ token, eventId }, { db });
		return htmlResponse(
			renderCalendarReplyPage({
				title: reply?.event.title ?? "Regina Rowing Club",
				subtitle: reply?.event.subtitle,
				message: error.message,
				type: reply?.event.type,
			}),
			error.code === "CONFLICT" ? 409 : 403,
		);
	}
}

function notFoundPage() {
	return renderCalendarReplyPage({
		title: "Link not found",
		message:
			"This calendar link is no longer valid. Open the schedule in the app to reply.",
	});
}

function htmlResponse(body: string, status = 200) {
	return new Response(body, {
		status,
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "no-store",
		},
	});
}
