import { DateTime } from "luxon";
import type { ActivityType, EventType } from "@/generated/prisma/client";
import { extractLinkTargets } from "@/lib/chat/links";
import { routes } from "@/lib/routes";
import {
	EVENT_TYPE_LABELS,
	formatEventDate,
	formatEventTime,
} from "@/lib/schedule/event-labels";
import type { ViewerContext } from "@/server/context";
import { getDisplayName } from "./chat-user-names";

type Db = ViewerContext["db"];

export type LinkedEventRow = {
	id: string;
	type: EventType;
	title: string;
	startAt: Date;
	endAt: Date | null;
	allDay: boolean;
	timezone: string;
	location: string | null;
};

export type LinkedActivityRow = {
	id: string;
	name: string;
	type: ActivityType;
	startDate: Date;
	timezone: string;
	distance: number;
	elapsedTime: number;
	athlete: {
		userId: string | null;
		firstName: string;
		lastName: string;
		nickname: string | null;
	};
};

export async function loadLinkPreviews(
	db: Db,
	messages: { id: string; authorUserId: string; text: string | null }[],
	viewerUserId: string,
) {
	const targetsByMessage = new Map(
		messages.map((message) => [
			message.id,
			message.text ? extractLinkTargets(message.text) : [],
		]),
	);
	const targets = [...targetsByMessage.values()].flat();
	const eventIds = [
		...new Set(targets.filter((t) => t.kind === "event").map((t) => t.id)),
	];
	const activityIds = [
		...new Set(targets.filter((t) => t.kind === "activity").map((t) => t.id)),
	];
	const [events, activities] = await Promise.all([
		eventIds.length
			? db.event.findMany({
					where: { id: { in: eventIds } },
					select: {
						id: true,
						type: true,
						title: true,
						startAt: true,
						endAt: true,
						allDay: true,
						timezone: true,
						location: true,
					},
				})
			: [],
		activityIds.length
			? db.activity.findMany({
					where: { id: { in: activityIds } },
					select: {
						id: true,
						name: true,
						type: true,
						startDate: true,
						timezone: true,
						distance: true,
						elapsedTime: true,
						athlete: {
							select: {
								userId: true,
								firstName: true,
								lastName: true,
								nickname: true,
							},
						},
					},
				})
			: [],
	]);
	const eventsById = new Map(events.map((event) => [event.id, event]));
	const activitiesById = new Map(
		activities.map((activity) => [activity.id, activity]),
	);
	return new Map(
		messages.map((message) => [
			message.id,
			buildLinkPreviews({
				targets: targetsByMessage.get(message.id) ?? [],
				eventsById,
				activitiesById,
				authorUserId: message.authorUserId,
				viewerUserId,
			}),
		]),
	);
}

export function buildLinkPreviews({
	targets,
	eventsById,
	activitiesById,
	authorUserId,
	viewerUserId,
}: {
	targets: ReturnType<typeof extractLinkTargets>;
	eventsById: Map<string, LinkedEventRow>;
	activitiesById: Map<string, LinkedActivityRow>;
	authorUserId: string;
	viewerUserId: string;
}): LinkPreview[] {
	return targets.flatMap<LinkPreview>((target) => {
		if (target.kind === "event") {
			const event = eventsById.get(target.id);
			return event ? [mapEventPreview(event)] : [];
		}
		const activity = activitiesById.get(target.id);
		if (!activity || activity.athlete.userId !== authorUserId) return [];
		return [mapActivityPreview(activity, viewerUserId)];
	});
}

export type LinkPreview =
	| ReturnType<typeof mapEventPreview>
	| ReturnType<typeof mapActivityPreview>;

function mapEventPreview(event: LinkedEventRow) {
	return {
		kind: "event" as const,
		id: event.id,
		title: event.title,
		type: event.type,
		typeLabel: EVENT_TYPE_LABELS[event.type],
		dateLabel: formatEventDate(event.startAt, event.timezone),
		timeLabel: formatEventTime(event),
		location: event.location,
		url: routes.schedule.view({ id: event.id }),
	};
}

function mapActivityPreview(activity: LinkedActivityRow, viewerUserId: string) {
	return {
		kind: "activity" as const,
		id: activity.id,
		name: activity.name,
		type: activity.type,
		athleteName: getDisplayName(activity.athlete),
		dateLabel: DateTime.fromJSDate(activity.startDate, {
			zone: activity.timezone,
		}).toFormat("cccc, LLL d"),
		distance: activity.distance,
		elapsedTime: activity.elapsedTime,
		url:
			activity.athlete.userId === viewerUserId
				? routes.activities.view(activity.id)
				: null,
	};
}
