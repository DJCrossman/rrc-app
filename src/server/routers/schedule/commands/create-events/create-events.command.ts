import type { CreateEvents } from "@/schemas";
import type { AdminContext } from "@/server/context";
import { createEventRow } from "@/server/routers/schedule/common/event-writes";

const CONCURRENCY = 8;

export async function createEventsCommand(
	input: CreateEvents,
	{ db, athlete }: AdminContext,
) {
	// A season of sessions is hundreds of round trips over the Neon adapter, too
	// slow for one interactive transaction, so each event is its own transaction
	// and several are written at once.
	const queue = [...input.events];
	const startTimes: Date[] = [];
	let failed = 0;
	await Promise.all(
		Array.from({ length: CONCURRENCY }, async () => {
			for (let event = queue.shift(); event; event = queue.shift()) {
				const current = event;
				try {
					const row = await db.$transaction((tx) =>
						createEventRow(tx, current, athlete?.id ?? null),
					);
					startTimes.push(row.startAt);
				} catch {
					failed++;
				}
			}
		}),
	);
	return {
		created: startTimes.length,
		failed,
		firstStartAt: startTimes
			.map((startAt) => startAt.toISOString())
			.sort()[0] as string | undefined,
	};
}
