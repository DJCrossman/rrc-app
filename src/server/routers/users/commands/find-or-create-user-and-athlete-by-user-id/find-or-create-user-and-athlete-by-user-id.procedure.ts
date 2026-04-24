import { protectedProcedure } from "@/server/procedures";
import { findOrCreateUserAndAthleteByUserIdCommand } from "./find-or-create-user-and-athlete-by-user-id.command";

export const findOrCreateUserAndAthleteByUserIdProcedure =
	protectedProcedure.mutation(({ ctx }) =>
		findOrCreateUserAndAthleteByUserIdCommand(undefined, ctx),
	);
