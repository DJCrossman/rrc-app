import { updateActivitySchema } from "@/schemas";
import { adminProcedure } from "@/server/common/procedures/admin.procedure";
import { updateActivityCommand } from "./update-activity.command";

export const updateActivityAdminProcedure = adminProcedure
	.input(updateActivitySchema)
	.mutation(({ ctx, input }) => updateActivityCommand(input, ctx));
