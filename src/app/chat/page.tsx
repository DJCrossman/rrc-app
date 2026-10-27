import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

export default function ChatPage() {
	redirect(routes.chat.everyone());
}
