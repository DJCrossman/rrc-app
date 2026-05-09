import { bulkCreateBoatsSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { bulkCreateBoatsCommand } from "./bulk-create-boats.command";

export const bulkCreateBoatsProcedure = protectedProcedure
	.input(bulkCreateBoatsSchema)
	.mutation(({ ctx, input }) => bulkCreateBoatsCommand(input, ctx));
