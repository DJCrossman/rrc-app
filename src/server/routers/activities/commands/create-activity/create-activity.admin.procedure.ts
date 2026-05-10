import { createActivitySchema } from "@/schemas";
import { adminProcedure } from "@/server/common/procedures/admin.procedure";
import { createActivityCommand } from "./create-activity.command";

export const createActivityAdminProcedure = adminProcedure
	.input(createActivitySchema)
	.mutation(({ ctx, input }) => createActivityCommand(input, ctx));
