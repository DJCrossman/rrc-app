import type { DateTime } from "luxon";
import type { ScheduleTypeFilter } from "@/schemas";

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
		list: (params: ScheduleRouteParams = {}) => toScheduleUrl(params),
		create: (params: ScheduleRouteParams = {}) =>
			toScheduleUrl({ ...params, action: "create" }),
		view: ({ id, ...params }: ScheduleRouteParams & { id: string }) =>
			toScheduleUrl({ ...params, eventId: id }),
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
	athletes: {
		list: () => "/athletes",
		create: () => "/athletes?action=create",
		bulkCreate: () => "/athletes?action=bulkCreate",
		view: (id: string) => `/athletes?athleteId=${id}`,
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
	settings: {
		account: () => "/settings/account",
		apps: () => "/settings/apps",
		notifications: () => "/settings/notifications",
	},
};

function toScheduleUrl({
	week,
	type,
	group,
	eventId,
	action,
}: ScheduleRouteParams & {
	eventId?: string;
	action?: "create";
}) {
	const params = new URLSearchParams();
	if (week) params.set("week", week.toISODate());
	if (type && type !== "all") params.set("type", type);
	if (group) params.set("group", group);
	if (eventId) params.set("eventId", eventId);
	if (action) params.set("action", action);
	const queryString = params.toString();
	return queryString ? `/schedule?${queryString}` : "/schedule";
}
