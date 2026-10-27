import { z } from "zod";
import { ChatScene } from "@/scenes/chat";

const querySchema = z.object({
	thread: z.string().optional(),
});

export default async function ChatChannelPage({
	params,
	searchParams,
}: {
	params: Promise<{ channelId: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { channelId } = await params;
	const { thread } = querySchema.parse(await searchParams);

	return <ChatScene channelId={channelId} threadMessageId={thread ?? null} />;
}
