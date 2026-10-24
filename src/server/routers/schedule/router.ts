import { router } from "@/server/trpc";
import { createEventProcedure } from "./commands/create-event/create-event.procedure";
import { deleteEventProcedure } from "./commands/delete-event/delete-event.procedure";
import { getCalendarTokenProcedure } from "./commands/get-calendar-token/get-calendar-token.procedure";
import { nudgeProcedure } from "./commands/nudge/nudge.procedure";
import { rotateCalendarTokenProcedure } from "./commands/rotate-calendar-token/rotate-calendar-token.procedure";
import { rsvpProcedure } from "./commands/rsvp/rsvp.procedure";
import { updateEventProcedure } from "./commands/update-event/update-event.procedure";
import { getEventByIdProcedure } from "./queries/get-event-by-id/get-event-by-id.procedure";
import { getResponsesProcedure } from "./queries/get-responses/get-responses.procedure";
import { getUpcomingProcedure } from "./queries/get-upcoming/get-upcoming.procedure";
import { getWeekProcedure } from "./queries/get-week/get-week.procedure";

export const scheduleRouter = router({
	getWeek: getWeekProcedure,
	getEventById: getEventByIdProcedure,
	getResponses: getResponsesProcedure,
	getUpcoming: getUpcomingProcedure,
	rsvp: rsvpProcedure,
	nudge: nudgeProcedure,
	createEvent: createEventProcedure,
	updateEvent: updateEventProcedure,
	deleteEvent: deleteEventProcedure,
	getCalendarToken: getCalendarTokenProcedure,
	rotateCalendarToken: rotateCalendarTokenProcedure,
});
