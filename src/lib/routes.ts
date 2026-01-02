import type { DateTime } from "luxon";

export const routes = {
	dashboard: {
		home: () => "/",
	},
	boats: {
		list: () => "/boats",
		create: () => "/boats?action=create",
		view: (id: number) => `/boats?boatId=${id}`,
	},
	athletes: {
		list: () => "/athletes",
		create: () => "/athletes?action=create",
		view: (id: number) => `/athletes?athleteId=${id}`,
	},
	ergs: {
		list: () => "/ergs",
		create: () => "/ergs?action=create",
		view: (id: number) => `/ergs?ergId=${id}`,
	},
	workouts: {
		list: ({ week }: { week?: DateTime<true> } = {}) => {
			const params = new URLSearchParams();
			if (week) {
				params.append("week", week.toISODate());
			}
			const queryString = params.toString();
			if (queryString) {
				return `/workouts?${queryString}`;
			}
			return "/workouts";
		},
		create: ({ week }: { week?: DateTime<true> } = {}) => {
			const params = new URLSearchParams({ action: "create" });
			if (week) {
				params.append("week", week.toISODate());
			}
			return `/workouts?${params.toString()}`;
		},
		view: ({ id, week }: { id: number; week?: DateTime<true> }) => {
			const params = new URLSearchParams({ workoutId: id.toString() });
			if (week) {
				params.append("week", week.toISODate());
			}
			const queryString = params.toString();
			return `/workouts?${queryString}`;
		},
	},
	settings: {
		account: () => "/settings/account",
		apps: () => "/settings/apps",
	},
};
