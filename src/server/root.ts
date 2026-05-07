import { activitiesRouter } from "./routers/activities/router";
import { analyticsRouter } from "./routers/analytics/router";
import { athletesRouter } from "./routers/athletes/router";
import { boatsRouter } from "./routers/boats/router";
import { ergsRouter } from "./routers/ergs/router";
import { programsRouter } from "./routers/programs/router";
import { usersRouter } from "./routers/users/router";
import { workoutsRouter } from "./routers/workouts/router";
import { router } from "./trpc";

export const appRouter = router({
	athletes: athletesRouter,
	activities: activitiesRouter,
	boats: boatsRouter,
	workouts: workoutsRouter,
	ergs: ergsRouter,
	programs: programsRouter,
	users: usersRouter,
	analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
