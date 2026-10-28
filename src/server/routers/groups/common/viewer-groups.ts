import type { ViewerContext } from "@/server/context";
import { getAthleteGroupIds } from "./group-members";

/** Admins see every group; everyone else sees only the groups they're in. */
export type ViewerGroups =
	| { isAdmin: true }
	| { isAdmin: false; groupIds: ReadonlySet<string> };

export function isViewerAdmin({ user, athlete }: ViewerContext) {
	return user.isAdmin || athlete?.role === "admin";
}

export async function getViewerGroups(
	ctx: ViewerContext,
): Promise<ViewerGroups> {
	if (isViewerAdmin(ctx)) {
		return { isAdmin: true };
	}
	const groupIds = ctx.athlete
		? await getAthleteGroupIds(ctx.db, ctx.athlete.id)
		: [];
	return { isAdmin: false, groupIds: new Set(groupIds) };
}

export function canSeeGroup(viewer: ViewerGroups, groupId: string) {
	return viewer.isAdmin || viewer.groupIds.has(groupId);
}
