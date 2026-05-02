import { protectedProcedure } from "@/server/procedures";
import { disconnectConcept2Command } from "./disconnect-concept2.command";

export const disconnectConcept2Procedure = protectedProcedure.mutation(
	({ ctx }) => disconnectConcept2Command(undefined, ctx),
);
