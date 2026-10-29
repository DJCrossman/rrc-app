"use client";

import { IconMessage } from "@tabler/icons-react";

import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { openFeedback } from "@/lib/feedback";

export function FeedbackButton() {
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton onClick={() => openFeedback()}>
					<IconMessage />
					<span>Feedback</span>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
