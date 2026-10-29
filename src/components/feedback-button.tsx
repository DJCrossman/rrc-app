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
				<SidebarMenuButton
					render={
						<a
							href={FEEDBACK_FORM_URL}
							target="_blank"
							rel="noopener noreferrer"
						>
							<IconMessage />
							<span>Feedback</span>
						</a>
					}
				/>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

export const FEEDBACK_FORM_URL = "https://forms.gle/FTKB91TKCfSxzhVJ9";
