import type { EventType, RsvpStatus } from "@/schemas";

export const CALENDAR_REPLY_STATUSES = ["yes", "maybe", "no", "none"] as const;
export type CalendarReplyStatus = (typeof CALENDAR_REPLY_STATUSES)[number];

export function getCalendarReplyOptions(type: EventType) {
	if (type === "volunteer") {
		return [
			{ status: "yes", label: "Sign up" },
			{ status: "none", label: "Withdraw" },
		] as const;
	}
	return [
		{ status: "yes", label: "Going" },
		{ status: "maybe", label: "Maybe" },
		{ status: "no", label: "Can't go" },
	] as const;
}

export function describeReply(type: EventType, status: RsvpStatus | null) {
	if (type === "volunteer") {
		return status === "yes" ? "Signed up" : "Not signed up";
	}
	switch (status) {
		case "yes":
			return "Going";
		case "maybe":
			return "Maybe";
		case "no":
			return "Can't go";
		default:
			return "No reply yet";
	}
}

export function formatCalendarReplyText({
	replyUrl,
	type,
	status,
}: {
	replyUrl: string;
	type: EventType;
	status: RsvpStatus | null;
}) {
	return [
		`Your reply: ${describeReply(type, status)}`,
		...getCalendarReplyOptions(type).map(
			(option) => `${option.label}: ${replyUrl}?status=${option.status}`,
		),
	].join("\n");
}

export function parseCalendarReplyStatus(
	value: FormDataEntryValue | string | null,
): CalendarReplyStatus | null {
	return CALENDAR_REPLY_STATUSES.find((status) => status === value) ?? null;
}
