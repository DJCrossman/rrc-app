import type { Metadata } from "next";
import { ChatListScene } from "@/scenes/chat";

export const metadata: Metadata = {
	title: "Chat · Regina Rowing Club",
};

export default function ChatPage() {
	return <ChatListScene />;
}
