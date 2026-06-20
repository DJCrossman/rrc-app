"use client";

import { IconMessage } from "@tabler/icons-react";

import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

export function FeedbackButton() {
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton asChild>
					<a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer">
						<IconMessage />
						<span>Feedback</span>
					</a>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

const GOOGLE_FORM_URL = "https://forms.gle/FTKB91TKCfSxzhVJ9";
