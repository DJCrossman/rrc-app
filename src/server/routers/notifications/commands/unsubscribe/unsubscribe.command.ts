import type { UnsubscribeFromPush } from "@/schemas";
import type { AuthenticatedContext } from "@/server/context";

export async function unsubscribeCommand(
	input: UnsubscribeFromPush,
	{ db, athlete }: AuthenticatedContext,
) {
	const { count } = await db.push_subscription.deleteMany({
		where: { endpoint: input.endpoint, athleteId: athlete.id },
	});

	return { removed: count };
}
