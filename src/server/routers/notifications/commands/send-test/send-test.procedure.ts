import { protectedProcedure } from "@/server/procedures";
import { sendTestCommand } from "./send-test.command";

export const sendTestProcedure = protectedProcedure.mutation(({ ctx }) =>
	sendTestCommand(undefined, ctx),
);
