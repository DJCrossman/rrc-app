// Only athletes with notifications on actually receive a nudge, so the toast says
// how many it reached — the coach can chase the rest some other way.
export function formatNudgeResult(count: number, reached: number) {
	if (reached >= count) {
		return `Reminder sent to ${count} ${count === 1 ? "person" : "people"}`;
	}
	const missed = count - reached;
	return `Reminder sent to ${reached} of ${count} — ${missed} ${missed === 1 ? "doesn't" : "don't"} have notifications on`;
}
