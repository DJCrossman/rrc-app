import { router } from "@/server/trpc";
import { createGroupProcedure } from "./commands/create-group/create-group.procedure";
import { deleteGroupProcedure } from "./commands/delete-group/delete-group.procedure";
import { updateGroupProcedure } from "./commands/update-group/update-group.procedure";
import { getGroupByIdProcedure } from "./queries/get-group-by-id/get-group-by-id.procedure";
import { getGroupsProcedure } from "./queries/get-groups/get-groups.procedure";
import { getMyGroupsProcedure } from "./queries/get-my-groups/get-my-groups.procedure";

export const groupsRouter = router({
	getGroups: getGroupsProcedure,
	getGroupById: getGroupByIdProcedure,
	getMyGroups: getMyGroupsProcedure,
	createGroup: createGroupProcedure,
	updateGroup: updateGroupProcedure,
	deleteGroup: deleteGroupProcedure,
});
