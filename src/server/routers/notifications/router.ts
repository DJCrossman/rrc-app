import { router } from "@/server/trpc";
import { sendTestProcedure } from "./commands/send-test/send-test.procedure";
import { setPreferenceProcedure } from "./commands/set-preference/set-preference.procedure";
import { subscribeProcedure } from "./commands/subscribe/subscribe.procedure";
import { unsubscribeProcedure } from "./commands/unsubscribe/unsubscribe.procedure";
import { getStatusProcedure } from "./queries/get-status/get-status.procedure";

export const notificationsRouter = router({
	getStatus: getStatusProcedure,
	subscribe: subscribeProcedure,
	unsubscribe: unsubscribeProcedure,
	setPreference: setPreferenceProcedure,
	sendTest: sendTestProcedure,
});
