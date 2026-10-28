import type { DateTime } from "luxon";
import type { ScheduleTypeFilter } from "@/schemas";
import { EVERYONE_CHANNEL_ID } from "@/schemas/chat.schema";

type ScheduleRouteParams = {
	week?: DateTime<true>;
	type?: ScheduleTypeFilter;
	group?: string;
};

export const routes = {
	dashboard: {
		home: () => "/",
	},
	schedule: {
		...scheduleRoutes("/schedule"),
		bulkEditTraining: ({ week }: Pick<ScheduleRouteParams, "week"> = {}) =>
			week
				? `/schedule/bulk-edit-training?week=${week.toISODate()}`
				: "/schedule/bulk-edit-training",
	},
	boats: {
		list: () => "/boats",
		create: () => "/boats?action=create",
		bulkCreate: () => "/boats?action=bulkCreate",
		view: (id: string) => `/boats?boatId=${id}`,
	},
	members: {
		list: () => "/members",
		create: () => "/members?action=create",
		bulkCreate: () => "/members?action=bulkCreate",
		view: (id: string) => `/members?athleteId=${id}`,
		edit: (id: string) => `/members?athleteId=${id}&action=edit`,
	},
	groups: {
		list: () => "/groups",
		create: () => "/groups?action=create",
		view: (id: string) => `/groups?groupId=${id}`,
		detail: (id: string) => `/groups/${id}`,
		schedule: (id: string) => scheduleRoutes(`/groups/${id}/schedule`),
	},
	ergs: {
		list: () => "/ergs",
		create: () => "/ergs?action=create",
		view: (id: string) => `/ergs?ergId=${id}`,
	},
	activities: {
		list: () => "/activities",
		create: () => "/activities?action=create",
		view: (id: string) => `/activities?activityId=${id}`,
	},
	chat: {
		channel: (id: string) => `/chat/${id}`,
		thread: (channelId: string, messageId: string) =>
			`/chat/${channelId}?thread=${messageId}`,
		everyone: () => `/chat/${EVERYONE_CHANNEL_ID}`,
	},
	onboarding: {
		start: () => "/onboarding",
	},
	settings: {
		account: () => "/settings/account",
		apps: () => "/settings/apps",
		notifications: () => "/settings/notifications",
	},
};

export type ScheduleRoutes = ReturnType<typeof scheduleRoutes>;

function scheduleRoutes(path: string) {
	return {
		list: (params: ScheduleRouteParams = {}) => toScheduleUrl(path, params),
		create: (params: ScheduleRouteParams = {}) =>
			toScheduleUrl(path, { ...params, action: "create" }),
		view: ({ id, ...params }: ScheduleRouteParams & { id: string }) =>
			toScheduleUrl(path, { ...params, eventId: id }),
	};
}

function toScheduleUrl(
	path: string,
	{
		week,
		type,
		group,
		eventId,
		action,
	}: ScheduleRouteParams & {
		eventId?: string;
		action?: "create";
	},
) {
	const params = new URLSearchParams();
	if (week) params.set("week", week.toISODate());
	if (type && type !== "all") params.set("type", type);
	if (group) params.set("group", group);
	if (eventId) params.set("eventId", eventId);
	if (action) params.set("action", action);
	const queryString = params.toString();
	return queryString ? `${path}?${queryString}` : path;
}
