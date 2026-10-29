import { activitiesRouter } from "./routers/activities/router";
import { adminRouter } from "./routers/admin/router";
import { analyticsRouter } from "./routers/analytics/router";
import { athletesRouter } from "./routers/athletes/router";
import { boatsRouter } from "./routers/boats/router";
import { chatRouter } from "./routers/chat/router";
import { ergsRouter } from "./routers/ergs/router";
import { feedbackRouter } from "./routers/feedback/router";
import { groupsRouter } from "./routers/groups/router";
import { membersRouter } from "./routers/members/router";
import { notificationsRouter } from "./routers/notifications/router";
import { programsRouter } from "./routers/programs/router";
import { scheduleRouter } from "./routers/schedule/router";
import { usersRouter } from "./routers/users/router";
import { workoutsRouter } from "./routers/workouts/router";
import { router } from "./trpc";

export const appRouter = router({
	athletes: athletesRouter,
	groups: groupsRouter,
	members: membersRouter,
	activities: activitiesRouter,
	boats: boatsRouter,
	workouts: workoutsRouter,
	ergs: ergsRouter,
	programs: programsRouter,
	users: usersRouter,
	analytics: analyticsRouter,
	admin: adminRouter,
	schedule: scheduleRouter,
	notifications: notificationsRouter,
	chat: chatRouter,
	feedback: feedbackRouter,
});

export type AppRouter = typeof appRouter;
