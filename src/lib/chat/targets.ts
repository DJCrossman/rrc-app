import type { ChatChannels, ChatMembers } from "@/lib/trpc/types";

export type ChatTarget = {
	key: string;
	name: string;
	kind: ChatChannels[number]["kind"];
} & ({ channelId: string } | { userId: string });

export function getChatTargets({
	channels,
	members,
	sourceChannelId,
}: {
	channels: Pick<ChatChannels[number], "id" | "name" | "kind" | "members">[];
	members: Pick<ChatMembers[number], "id" | "name">[];
	sourceChannelId?: string;
}): ChatTarget[] {
	const membersWithDm = new Set(
		channels.flatMap((channel) =>
			channel.kind === "direct_message" && channel.members.length === 1
				? [channel.members[0].id]
				: [],
		),
	);
	return [
		...channels
			.filter((channel) => channel.id !== sourceChannelId)
			.map((channel) => ({
				key: `channel:${channel.id}`,
				name: channel.name,
				kind: channel.kind,
				channelId: channel.id,
			})),
		...members
			.filter((member) => !membersWithDm.has(member.id))
			.map((member) => ({
				key: `member:${member.id}`,
				name: member.name,
				kind: "direct_message" as const,
				userId: member.id,
			})),
	];
}
