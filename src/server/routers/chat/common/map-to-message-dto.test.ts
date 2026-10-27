import { describe, expect, it } from "vitest";
import type { ChatUser } from "./chat-user-names";
import {
	collectMessageUserIds,
	type MessageRow,
	mapForwardedMessage,
	mapQuotedMessage,
	mapToMessageDto,
	resolveForwardSourceId,
} from "./map-to-message-dto";

const at = (minute: number) => new Date(Date.UTC(2026, 9, 23, 6, minute));
const user = (
	id: string,
	name: string,
	initials: string,
	isCoach = false,
): ChatUser => ({
	id,
	name,
	initials,
	isCoach,
});
const sarah = user("user_sarah", "Sarah Chen", "SC");
const mike = user("user_mike", "Mike Lee", "ML", true);
const priya = user("user_priya", "Priya Shah", "PS");
const tom = user("user_tom", "Tom Ward", "TW");
const users = new Map([sarah, mike, priya, tom].map((u) => [u.id, u]));

const messageRow = (overrides: Partial<MessageRow> = {}): MessageRow => ({
	id: "msg_1",
	channelId: "chan_everyone",
	authorUserId: sarah.id,
	parentId: null,
	text: "Water's flat, see you at 6",
	gif: null,
	quotedMessageId: null,
	forwardedFromId: null,
	createdAt: at(0),
	updatedAt: at(0),
	deletedAt: null,
	reactions: [],
	quotedMessage: null,
	forwardedFrom: null,
	replies: [],
	...overrides,
});

const viewer = { userId: sarah.id, isAdmin: false };

describe("resolveForwardSourceId", () => {
	it("forwards an original message as itself and a forward as its original", () => {
		expect(resolveForwardSourceId({ id: "msg_1", forwardedFromId: null })).toBe(
			"msg_1",
		);
		expect(
			resolveForwardSourceId({ id: "msg_2", forwardedFromId: "msg_1" }),
		).toBe("msg_1");
	});
});

describe("mapForwardedMessage", () => {
	const original = (
		channel: {
			kind: "everyone" | "group" | "direct_message";
			groupId: string | null;
		},
		deletedAt: Date | null = null,
	): MessageRow["forwardedFrom"] => ({
		id: "msg_original",
		text: "Regatta entries close Friday",
		gif: null,
		deletedAt,
		createdAt: at(1),
		authorUserId: mike.id,
		channel,
	});

	it("labels the source channel and resolves the original author", () => {
		expect(
			mapForwardedMessage(original({ kind: "everyone", groupId: null }), users),
		).toEqual({
			id: "msg_original",
			channelName: "Everyone",
			author: mike,
			text: "Regatta entries close Friday",
			gif: null,
			createdAt: at(1).toISOString(),
			deleted: false,
		});
	});

	it("names direct message sources without revealing who was in them", () => {
		expect(
			mapForwardedMessage(
				original({ kind: "direct_message", groupId: null }),
				users,
			)?.channelName,
		).toBe("a direct message");
	});

	it("hides the content of a deleted original", () => {
		expect(
			mapForwardedMessage(
				original({ kind: "everyone", groupId: null }, at(5)),
				users,
			),
		).toMatchObject({ deleted: true, text: null, gif: null });
	});
});

describe("mapQuotedMessage", () => {
	it("maps the quoted author and hides deleted text", () => {
		const quoted = {
			id: "msg_q",
			text: "Who has the trailer keys?",
			gif: null,
			deletedAt: null,
			authorUserId: priya.id,
		};
		expect(mapQuotedMessage(quoted, users)).toMatchObject({
			author: priya,
			text: "Who has the trailer keys?",
			deleted: false,
		});
		expect(
			mapQuotedMessage({ ...quoted, deletedAt: at(3) }, users),
		).toMatchObject({
			deleted: true,
			text: null,
		});
	});

	it("falls back to a placeholder for someone who is no longer around", () => {
		expect(
			mapQuotedMessage(
				{
					id: "msg_q",
					text: "Hi",
					gif: null,
					deletedAt: null,
					authorUserId: "user_gone",
				},
				users,
			)?.author,
		).toEqual({
			id: "user_gone",
			name: "Former member",
			initials: "?",
			isCoach: false,
		});
	});
});

describe("mapToMessageDto", () => {
	it("groups reactions by emoji with names and my reaction", () => {
		const dto = mapToMessageDto(
			messageRow({
				reactions: [
					{ emoji: "✅", userId: mike.id },
					{ emoji: "👀", userId: priya.id },
					{ emoji: "✅", userId: sarah.id },
				],
			}),
			viewer,
			users,
		);
		expect(dto.reactions).toEqual([
			{ emoji: "✅", count: 2, names: ["Mike Lee", "You"], reactedByMe: true },
			{ emoji: "👀", count: 1, names: ["Priya Shah"], reactedByMe: false },
		]);
	});

	it("summarizes replies with up to three distinct reply authors", () => {
		const dto = mapToMessageDto(
			messageRow({
				replies: [
					{ createdAt: at(30), authorUserId: tom.id },
					{ createdAt: at(20), authorUserId: mike.id },
					{ createdAt: at(15), authorUserId: tom.id },
					{ createdAt: at(10), authorUserId: priya.id },
					{ createdAt: at(5), authorUserId: sarah.id },
				],
			}),
			viewer,
			users,
		);
		expect(dto.replyCount).toBe(5);
		expect(dto.lastReplyAt).toBe(at(30).toISOString());
		expect(dto.replyAuthors.map((author) => author.initials)).toEqual([
			"TW",
			"ML",
			"PS",
		]);
	});

	it("lets the author or an admin delete, and hides deleted content", () => {
		const row = messageRow({ reactions: [{ emoji: "🙌", userId: mike.id }] });
		expect(mapToMessageDto(row, viewer, users).canDelete).toBe(true);
		expect(
			mapToMessageDto(row, { userId: priya.id, isAdmin: false }, users)
				.canDelete,
		).toBe(false);
		expect(
			mapToMessageDto(row, { userId: mike.id, isAdmin: true }, users).canDelete,
		).toBe(true);
		expect(
			mapToMessageDto({ ...row, deletedAt: at(9) }, viewer, users),
		).toMatchObject({
			deleted: true,
			canDelete: false,
			text: null,
			reactions: [],
		});
	});
});

describe("collectMessageUserIds", () => {
	it("collects authors from reactions, replies, quotes and forwards", () => {
		const ids = collectMessageUserIds([
			messageRow({
				reactions: [{ emoji: "✅", userId: mike.id }],
				replies: [{ createdAt: at(1), authorUserId: tom.id }],
				quotedMessage: {
					id: "q",
					text: "x",
					gif: null,
					deletedAt: null,
					authorUserId: priya.id,
				},
			}),
		]);
		expect(new Set(ids)).toEqual(
			new Set([sarah.id, mike.id, tom.id, priya.id]),
		);
	});
});
