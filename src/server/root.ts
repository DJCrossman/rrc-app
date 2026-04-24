import { activitiesRouter } from "./routers/activities/router";
import { analyticsRouter } from "./routers/analytics/router";
import { athletesRouter } from "./routers/athletes/router";
import { boatsRouter } from "./routers/boats/router";
import { concept2Router } from "./routers/concept2/router";
import { ergsRouter } from "./routers/ergs/router";
import { stravaRouter } from "./routers/strava/router";
import { usersRouter } from "./routers/users/router";
import { workoutsRouter } from "./routers/workouts/router";
import { router } from "./trpc";

export const appRouter = router({
	athletes: athletesRouter,
	activities: activitiesRouter,
	boats: boatsRouter,
	workouts: workoutsRouter,
	ergs: ergsRouter,
	users: usersRouter,
	analytics: analyticsRouter,
	concept2: concept2Router,
	strava: stravaRouter,
});

export type AppRouter = typeof appRouter;
