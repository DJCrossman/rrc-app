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
		list: () => "/workouts",
		create: () => "/workouts/create",
		view: (id: number) => `/workouts/${id}`,
	},
};
