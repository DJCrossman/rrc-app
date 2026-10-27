import type { ViewerContext } from "@/server/context";
import { isChatAdmin } from "./chat-access";
import { loadChatUsers } from "./chat-users";
import { loadLinkPreviews } from "./link-previews";
import {
	collectMessageUserIds,
	type MessageRow,
	mapToMessageDto,
} from "./map-to-message-dto";

export async function loadMessageDtos(ctx: ViewerContext, rows: MessageRow[]) {
	const viewer = { userId: ctx.user.id, isAdmin: isChatAdmin(ctx) };
	const [users, previews] = await Promise.all([
		loadChatUsers(ctx.db, collectMessageUserIds(rows)),
		loadLinkPreviews(ctx.db, rows, ctx.user.id),
	]);
	return rows.map((row) =>
		mapToMessageDto(row, viewer, users, previews.get(row.id)),
	);
}
