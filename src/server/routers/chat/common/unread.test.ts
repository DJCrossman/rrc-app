import { describe, expect, it } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import {
	buildUnreadMessageWhere,
	readMarkerBefore,
	toUnreadCounts,
} from "./unread";

type MessageFixture = {
	channelId: string;
	authorUserId: string;
	parentId: string | null;
	deletedAt: Date | null;
	createdAt: Date;
};

const me = "user_me";
const other = "user_other";
const at = (minute: number) => new Date(Date.UTC(2026, 9, 23, 6, minute));

const message = (overrides: Partial<MessageFixture>): MessageFixture => ({
	channelId: "chan_everyone",
	authorUserId: other,
	parentId: null,
	deletedAt: null,
	createdAt: at(10),
	...overrides,
});

// Evaluates the subset of Prisma's where semantics the builder emits, so the
// filter can be checked against fixture rows the way the grouped query would.
function matches(row: MessageFixture, where: Record<string, unknown>): boolean {
	return Object.entries(where).every(([key, condition]) => {
		if (key === "OR") {
			return (condition as Record<string, unknown>[]).some((option) =>
				matches(row, option),
			);
		}
		const value = row[key as keyof MessageFixture];
		if (condition === null || typeof condition === "string") {
			return value === condition;
		}
		const { not, gt, gte } = condition as {
			not?: string;
			gt?: Date;
			gte?: Date;
		};
		if (not !== undefined) return value !== not;
		if (gt === undefined && gte === undefined) {
			throw new Error(`Unsupported condition on ${key}`);
		}
		return (
			value instanceof Date &&
			(gt === undefined || value > gt) &&
			(gte === undefined || value >= gte)
		);
	});
}

function countUnread(
	rows: MessageFixture[],
	channelIds: string[],
	reads: { channelId: string; lastReadAt: Date }[],
	visibleFromByChannel?: Map<string, Date>,
) {
	const where: Prisma.messageWhereInput = buildUnreadMessageWhere({
		userId: me,
		channelIds,
		reads,
		visibleFromByChannel,
	});
	const counts = new Map<string, number>();
	for (const row of rows.filter((row) => matches(row, where))) {
		counts.set(row.channelId, (counts.get(row.channelId) ?? 0) + 1);
	}
	return toUnreadCounts(
		channelIds,
		[...counts].map(([channelId, count]) => ({
			channelId,
			_count: { _all: count },
		})),
	);
}

describe("unread counting", () => {
	const reads = [{ channelId: "chan_everyone", lastReadAt: at(10) }];

	it("counts top-level messages from others after the last read", () => {
		const rows = [
			message({ createdAt: at(5) }),
			message({ createdAt: at(10) }),
			message({ createdAt: at(11) }),
			message({ createdAt: at(12) }),
		];
		expect(
			countUnread(rows, ["chan_everyone"], reads).get("chan_everyone"),
		).toBe(2);
	});

	it("ignores my own messages", () => {
		const rows = [message({ authorUserId: me, createdAt: at(11) })];
		expect(
			countUnread(rows, ["chan_everyone"], reads).get("chan_everyone"),
		).toBe(0);
	});

	it("ignores thread replies and deleted messages", () => {
		const rows = [
			message({ parentId: "msg_root", createdAt: at(11) }),
			message({ deletedAt: at(13), createdAt: at(12) }),
		];
		expect(
			countUnread(rows, ["chan_everyone"], reads).get("chan_everyone"),
		).toBe(0);
	});

	it("counts every message in a channel that was never read", () => {
		const rows = [
			message({ channelId: "chan_dm", createdAt: at(1) }),
			message({ channelId: "chan_dm", createdAt: at(2) }),
		];
		expect(countUnread(rows, ["chan_dm"], reads).get("chan_dm")).toBe(2);
	});

	it("applies each channel's own last read time", () => {
		const rows = [
			message({ channelId: "chan_everyone", createdAt: at(11) }),
			message({ channelId: "chan_group", createdAt: at(11) }),
			message({ channelId: "chan_group", createdAt: at(21) }),
		];
		const counts = countUnread(
			rows,
			["chan_everyone", "chan_group"],
			[...reads, { channelId: "chan_group", lastReadAt: at(20) }],
		);
		expect(counts.get("chan_everyone")).toBe(1);
		expect(counts.get("chan_group")).toBe(1);
	});

	it("skips messages from before I was added without history", () => {
		const rows = [
			message({ channelId: "chan_dm", createdAt: at(1) }),
			message({ channelId: "chan_dm", createdAt: at(5) }),
			message({ channelId: "chan_dm", createdAt: at(6) }),
		];
		const visibleFrom = new Map([["chan_dm", at(5)]]);
		expect(countUnread(rows, ["chan_dm"], [], visibleFrom).get("chan_dm")).toBe(
			2,
		);
		expect(
			countUnread(
				rows,
				["chan_dm"],
				[{ channelId: "chan_dm", lastReadAt: at(5) }],
				visibleFrom,
			).get("chan_dm"),
		).toBe(1);
	});

	it("counts a message marked unread and everything after it", () => {
		const rows = [
			message({ createdAt: at(1) }),
			message({ createdAt: at(5) }),
			message({ createdAt: at(6) }),
		];
		const reads = [
			{ channelId: "chan_everyone", lastReadAt: readMarkerBefore(at(5)) },
		];
		expect(
			countUnread(rows, ["chan_everyone"], reads).get("chan_everyone"),
		).toBe(2);
	});

	it("reports zero for channels without unread messages and skips unknown channels", () => {
		const rows = [message({ channelId: "chan_hidden", createdAt: at(30) })];
		const counts = countUnread(rows, ["chan_everyone"], reads);
		expect([...counts]).toEqual([["chan_everyone", 0]]);
	});
});
