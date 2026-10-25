import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/root";

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export type Athlete = NonNullable<RouterOutputs["athletes"]["getAthleteById"]>;
export type Athletes = RouterOutputs["athletes"]["getAthletes"]["data"];
export type AthletesResult = RouterOutputs["athletes"]["getAthletes"];

export type Activity = NonNullable<
	RouterOutputs["activities"]["getActivityById"]
>;
export type Activities = RouterOutputs["activities"]["getActivities"]["data"];
export type ActivitiesResult = RouterOutputs["activities"]["getActivities"];

export type Group = NonNullable<RouterOutputs["groups"]["getGroupById"]>;
export type Groups = RouterOutputs["groups"]["getGroups"]["data"];
export type GroupMember = Group["members"][number];

export type Programs = RouterOutputs["programs"]["getPrograms"]["data"];

export type Boat = NonNullable<RouterOutputs["boats"]["getBoatById"]>;
export type Boats = RouterOutputs["boats"]["getBoats"]["data"];
export type BoatsResult = RouterOutputs["boats"]["getBoats"];

export type Erg = NonNullable<RouterOutputs["ergs"]["getErgById"]>;
export type Ergs = RouterOutputs["ergs"]["getErgs"]["data"];
export type ErgsResult = RouterOutputs["ergs"]["getErgs"];

export type Workout = NonNullable<RouterOutputs["workouts"]["getWorkoutById"]>;
export type Workouts = RouterOutputs["workouts"]["getWorkouts"]["data"];
export type WorkoutFragment = Workout["fragments"][number];

export type CurrentAthlete = RouterOutputs["users"]["getUserById"];

export type Analytics = RouterOutputs["analytics"]["getAnalytics"];
export type AnalyticMetrics = Analytics["analyticMetrics"];
export type MetersTimeSeries = Analytics["metersTimeSeries"];
export type Leaderboard = RouterOutputs["analytics"]["getLeaderboard"]["data"];

export type ScheduleWeek = RouterOutputs["schedule"]["getWeek"];
export type ScheduleDay = ScheduleWeek["days"][number];
export type ScheduleEvent = ScheduleDay["events"][number];
export type EventResponses = RouterOutputs["schedule"]["getResponses"];
export type EventResponsePerson = EventResponses["going"][number];
export type UpcomingSchedule = RouterOutputs["schedule"]["getUpcoming"];
