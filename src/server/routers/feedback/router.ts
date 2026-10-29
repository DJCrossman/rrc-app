import { router } from "@/server/trpc";
import { submitProcedure } from "./commands/submit/submit.procedure";

export const feedbackRouter = router({
	submit: submitProcedure,
});
