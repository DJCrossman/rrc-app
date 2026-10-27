import { inviteMembersSchema } from "@/schemas";
import { adminProcedure } from "@/server/procedures";
import { inviteMembersCommand } from "./invite-members.command";

export const inviteMembersProcedure = adminProcedure
	.input(inviteMembersSchema)
	.mutation(({ ctx, input }) => inviteMembersCommand(input, ctx));
