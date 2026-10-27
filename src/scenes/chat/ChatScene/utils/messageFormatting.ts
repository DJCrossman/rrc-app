import { DateTime } from "luxon";
import type { ChatMessage } from "@/lib/trpc/types";

export function groupMessagesByDay<T extends { createdAt: string }>(
	messages: T[],
	now: DateTime = DateTime.now(),
) {
	const days: { key: string; label: string; messages: T[] }[] = [];
	for (const message of messages) {
		const day = DateTime.fromISO(message.createdAt, { zone: now.zone }).startOf(
			"day",
		);
		const key = day.toISODate() ?? message.createdAt;
		const current = days.at(-1);
		if (current?.key === key) {
			current.messages.push(message);
		} else {
			days.push({ key, label: formatDayLabel(day, now), messages: [message] });
		}
	}
	return days;
}

export function formatDayLabel(day: DateTime, now: DateTime) {
	if (day.hasSame(now, "day")) return "Today";
	if (day.hasSame(now.minus({ days: 1 }), "day")) return "Yesterday";
	return day.toFormat(
		day.hasSame(now, "year") ? "cccc, LLLL d" : "cccc, LLLL d, yyyy",
	);
}

export function formatMessageTime(iso: string) {
	return DateTime.fromISO(iso).toFormat("h:mm a");
}

export function formatLastReply(iso: string, now: DateTime = DateTime.now()) {
	const time = DateTime.fromISO(iso, { zone: now.zone });
	return time.toFormat(time.hasSame(now, "day") ? "h:mm a" : "LLL d");
}

export function formatReactors(names: string[]) {
	if (names.length <= 1) return names[0] ?? "";
	return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

export function getMessagePreviewText(
	message: Pick<ChatMessage, "text" | "gif" | "forwarded">,
) {
	if (message.text) return message.text;
	if (message.gif) return `GIF: ${message.gif}`;
	if (message.forwarded) {
		return (
			message.forwarded.text ??
			(message.forwarded.gif
				? `GIF: ${message.forwarded.gif}`
				: "Forwarded message")
		);
	}
	return "";
}
