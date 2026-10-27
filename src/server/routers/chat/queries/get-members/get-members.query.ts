import { paginate } from "@/lib/pagination";
import type { ViewerContext } from "@/server/context";
import { listChatUsers } from "@/server/routers/chat/common/chat-users";

export async function getMembersQuery(
	_input: undefined,
	{ db, user }: ViewerContext,
) {
	const data = await listChatUsers(db, user.id);
	return paginate({ data, totalCount: data.length });
}
