import { router } from "@/server/trpc";
import { addDmMembersProcedure } from "./commands/add-dm-members/add-dm-members.procedure";
import { deleteMessageProcedure } from "./commands/delete-message/delete-message.procedure";
import { forwardMessageProcedure } from "./commands/forward-message/forward-message.procedure";
import { leaveDmProcedure } from "./commands/leave-dm/leave-dm.procedure";
import { markReadProcedure } from "./commands/mark-read/mark-read.procedure";
import { markUnreadProcedure } from "./commands/mark-unread/mark-unread.procedure";
import { replyInThreadProcedure } from "./commands/reply-in-thread/reply-in-thread.procedure";
import { sendMessageProcedure } from "./commands/send-message/send-message.procedure";
import { startDmProcedure } from "./commands/start-dm/start-dm.procedure";
import { toggleReactionProcedure } from "./commands/toggle-reaction/toggle-reaction.procedure";
import { getChannelsProcedure } from "./queries/get-channels/get-channels.procedure";
import { getMembersProcedure } from "./queries/get-members/get-members.procedure";
import { getMessagesProcedure } from "./queries/get-messages/get-messages.procedure";
import { getThreadProcedure } from "./queries/get-thread/get-thread.procedure";

export const chatRouter = router({
	getChannels: getChannelsProcedure,
	getMembers: getMembersProcedure,
	getMessages: getMessagesProcedure,
	getThread: getThreadProcedure,
	sendMessage: sendMessageProcedure,
	replyInThread: replyInThreadProcedure,
	toggleReaction: toggleReactionProcedure,
	forwardMessage: forwardMessageProcedure,
	markRead: markReadProcedure,
	markUnread: markUnreadProcedure,
	startDm: startDmProcedure,
	addDmMembers: addDmMembersProcedure,
	leaveDm: leaveDmProcedure,
	deleteMessage: deleteMessageProcedure,
});
