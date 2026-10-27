import { z } from "zod";

export const EVERYONE_CHANNEL_ID = "everyone";
export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_DM_MEMBERS = 9;

const messageTextSchema = z
	.string()
	.trim()
	.max(
		MAX_MESSAGE_LENGTH,
		`Messages can be at most ${MAX_MESSAGE_LENGTH} characters`,
	);
const gifSchema = z.string().trim().min(1).max(100);

const hasContent = (value: { text?: string; gif?: string }) =>
	!!value.text || !!value.gif;
const missingContent = {
	message: "A message needs text or a GIF",
	path: ["text"],
};

export const getMessagesInputSchema = z.object({
	channelId: z.string(),
	cursor: z.string().nullish(),
	limit: z.number().int().min(1).max(100).default(50),
});
export type GetMessagesInput = z.infer<typeof getMessagesInputSchema>;

export const getThreadInputSchema = z.object({ messageId: z.string() });
export type GetThreadInput = z.infer<typeof getThreadInputSchema>;

export const sendMessageSchema = z
	.object({
		channelId: z.string(),
		text: messageTextSchema.optional(),
		gif: gifSchema.optional(),
		quotedMessageId: z.string().optional(),
	})
	.refine(hasContent, missingContent);
export type SendMessage = z.infer<typeof sendMessageSchema>;

export const replyInThreadSchema = z
	.object({
		messageId: z.string(),
		text: messageTextSchema.optional(),
		gif: gifSchema.optional(),
		alsoSendToChannel: z.boolean().optional(),
	})
	.refine(hasContent, missingContent);
export type ReplyInThread = z.infer<typeof replyInThreadSchema>;

export const toggleReactionSchema = z.object({
	messageId: z.string(),
	emoji: z.string().trim().min(1).max(32),
});
export type ToggleReaction = z.infer<typeof toggleReactionSchema>;

export const forwardMessageSchema = z.object({
	messageId: z.string(),
	targetChannelId: z.string(),
	note: messageTextSchema.optional(),
});
export type ForwardMessage = z.infer<typeof forwardMessageSchema>;

export const markReadSchema = z.object({ channelId: z.string() });
export type MarkRead = z.infer<typeof markReadSchema>;

export const markUnreadSchema = z.object({ messageId: z.string() });
export type MarkUnread = z.infer<typeof markUnreadSchema>;

const otherUserIdsSchema = z
	.array(z.string().min(1))
	.min(1, "Choose at least one person")
	.max(
		MAX_DM_MEMBERS - 1,
		`A conversation can have at most ${MAX_DM_MEMBERS} people`,
	)
	.refine(
		(ids) => new Set(ids).size === ids.length,
		"Each person can only be added once",
	);

export const startDmSchema = z.object({ userIds: otherUserIdsSchema });
export type StartDm = z.infer<typeof startDmSchema>;

export const addDmMembersSchema = z.object({
	channelId: z.string(),
	userIds: otherUserIdsSchema,
	shareHistory: z.boolean().default(true),
});
export type AddDmMembers = z.infer<typeof addDmMembersSchema>;

export const leaveDmSchema = z.object({ channelId: z.string() });
export type LeaveDm = z.infer<typeof leaveDmSchema>;

export const deleteMessageSchema = z.object({ messageId: z.string() });
export type DeleteMessage = z.infer<typeof deleteMessageSchema>;

export const messageComposerSchema = z.object({
	text: messageTextSchema,
	alsoSendToChannel: z.boolean(),
});
export type MessageComposerValues = z.infer<typeof messageComposerSchema>;

export const chatTargetFormSchema = z.object({
	targetKey: z.string().min(1, "Choose where to send it"),
	note: messageTextSchema,
});
export type ChatTargetFormValues = z.infer<typeof chatTargetFormSchema>;
