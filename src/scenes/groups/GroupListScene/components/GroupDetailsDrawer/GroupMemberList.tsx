"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { GroupMember } from "@/lib/trpc/types";

interface GroupMemberListProps {
	members: GroupMember[];
}

export function GroupMemberList({ members }: GroupMemberListProps) {
	if (!members.length) {
		return (
			<p className="text-muted-foreground py-6 text-center text-sm">
				No members yet.
			</p>
		);
	}

	return (
		<ul className="divide-y">
			{members.map((member) => (
				<li key={member.id} className="flex items-center gap-3 py-2">
					<Avatar className="size-8">
						<AvatarFallback className="text-xs">
							{member.initials}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium">{member.name}</p>
						{member.program && (
							<p className="text-muted-foreground truncate text-xs">
								{member.program}
							</p>
						)}
					</div>
				</li>
			))}
		</ul>
	);
}
