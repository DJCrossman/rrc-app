import { definePermission } from "@/server/common/permission";
import type { ViewerContext } from "@/server/context";
import { type GroupsDb, getAthleteGroupIds } from "./group-members";

/** Admins see every group; everyone else sees only the groups they're in. */
export type ViewerGroups =
	| { isAdmin: true }
	| { isAdmin: false; groupIds: ReadonlySet<string> };

export function isViewerAdmin({
	user,
	athlete,
}: {
	user: Pick<ViewerContext["user"], "isAdmin">;
	athlete: { role: string } | null;
}) {
	return user.isAdmin || athlete?.role === "admin";
}

// Each request builds its own user object, so keying on it shares the lookup
// between a procedure's permission check and its handler without leaking
// across requests.
const viewerGroupsByUser = new WeakMap<object, Promise<ViewerGroups>>();

export function getViewerGroups(ctx: ViewerContext): Promise<ViewerGroups> {
	const cached = viewerGroupsByUser.get(ctx.user);
	if (cached) {
		return cached;
	}
	const groups = loadViewerGroups(ctx);
	viewerGroupsByUser.set(ctx.user, groups);
	return groups;
}

function loadViewerGroups(ctx: ViewerContext): Promise<ViewerGroups> {
	return resolveViewerGroups(ctx.db, {
		isAdmin: isViewerAdmin(ctx),
		athleteId: ctx.athlete?.id ?? null,
	});
}

export async function resolveViewerGroups(
	db: GroupsDb,
	{ isAdmin, athleteId }: { isAdmin: boolean; athleteId: string | null },
): Promise<ViewerGroups> {
	if (isAdmin) {
		return { isAdmin: true };
	}
	const groupIds = athleteId ? await getAthleteGroupIds(db, athleteId) : [];
	return { isAdmin: false, groupIds: new Set(groupIds) };
}

export function canSeeGroup(viewer: ViewerGroups, groupId: string) {
	return viewer.isAdmin || viewer.groupIds.has(groupId);
}

const GROUP_NOT_FOUND = {
	code: "NOT_FOUND",
	message: "Group not found",
} as const;

/** For procedures about one group, taking its `id`. */
export const canViewGroup = definePermission<ViewerContext, { id: string }>(
	async ({ ctx, input }) => canSeeGroup(await getViewerGroups(ctx), input.id),
	GROUP_NOT_FOUND,
);

/** For procedures that can be narrowed to a group with `groupId`. */
export const canViewGroupScope = definePermission<
	ViewerContext,
	{ groupId?: string }
>(
	async ({ ctx, input }) =>
		!input.groupId || canSeeGroup(await getViewerGroups(ctx), input.groupId),
	GROUP_NOT_FOUND,
);
