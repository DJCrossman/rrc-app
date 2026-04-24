import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/root";

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export type Athlete = NonNullable<RouterOutputs["athletes"]["getAthleteById"]>;
export type Athletes = RouterOutputs["athletes"]["getAthletes"]["data"];

export type Activity = NonNullable<
	RouterOutputs["activities"]["getActivityById"]
>;
export type Activities = RouterOutputs["activities"]["getActivities"]["data"];

export type Boat = NonNullable<RouterOutputs["boats"]["getBoatById"]>;
export type Boats = RouterOutputs["boats"]["getBoats"]["data"];

export type Erg = NonNullable<RouterOutputs["ergs"]["getErgById"]>;
export type Ergs = RouterOutputs["ergs"]["getErgs"]["data"];

export type Workout = NonNullable<RouterOutputs["workouts"]["getWorkoutById"]>;
export type Workouts = RouterOutputs["workouts"]["getWorkouts"]["data"];
export type WorkoutFragment = Workout["fragments"][number];

export type CurrentAthlete = RouterOutputs["users"]["getUserById"];

export type Analytics = RouterOutputs["analytics"]["getAnalytics"];
export type AnalyticMetrics = Analytics["analyticMetrics"];
export type MetersTimeSeries = Analytics["metersTimeSeries"];
export type Leaderboard = Analytics["leaderboard"];
