import type { activity_inbox } from "@/generated/prisma/client";

export function mapToInboxDto(row: activity_inbox) {
	return {
		id: row.id,
		source: row.source,
		kind: row.kind,
		status: row.status,
		receivedAt: row.receivedAt.toISOString(),
	};
}

export type ActivityInboxDto = ReturnType<typeof mapToInboxDto>;
