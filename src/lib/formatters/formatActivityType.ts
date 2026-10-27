import type { WorkoutActivityType } from "@/schemas/workouts.schema";

const activityTypeLabels = {
	water: "On Water",
	erg: "Erg",
	crossTrain: "Cross-Train",
	strength: "S&C",
} satisfies Record<WorkoutActivityType, string>;

export const formatActivityType = (activityType: WorkoutActivityType) =>
	activityTypeLabels[activityType];
