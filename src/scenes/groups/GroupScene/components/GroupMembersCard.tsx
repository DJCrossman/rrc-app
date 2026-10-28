import Link from "next/link";
import { InitialsAvatar } from "@/components/chat/initials-avatar";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import type { Group } from "@/lib/trpc/types";

const MAX_AVATARS = 24;

interface GroupMembersCardProps {
	group: Group;
	isAdmin: boolean;
}

export const GroupMembersCard = ({ group, isAdmin }: GroupMembersCardProps) => {
	const coaches = group.members.filter((member) => member.isCoach);
	const hidden = group.members.length - MAX_AVATARS;
	return (
		<section className="flex flex-col gap-2.5 rounded-xl border bg-card p-4 text-card-foreground">
			<div className="flex min-h-7 items-center justify-between gap-2">
				<h3 className="text-sm font-medium text-muted-foreground">
					{group.memberCount} {group.memberCount === 1 ? "member" : "members"}
				</h3>
				{isAdmin && (
					<Button
						variant="outline"
						size="sm"
						className="h-7 text-xs"
						render={<Link href={routes.groups.view(group.id)} />}
					>
						Manage
					</Button>
				)}
			</div>
			{group.members.length === 0 ? (
				<p className="text-[13px] text-muted-foreground">
					Nobody is in this group yet.
				</p>
			) : (
				<ul className="flex flex-wrap gap-1.5">
					{group.members.slice(0, MAX_AVATARS).map((member) => (
						<li key={member.id}>
							<InitialsAvatar
								initials={member.initials}
								name={member.name}
								size="xs"
								className="size-6 text-[10px]"
							/>
						</li>
					))}
					{hidden > 0 && (
						<li className="flex h-6 items-center px-1 text-xs text-muted-foreground">
							+{hidden}
						</li>
					)}
				</ul>
			)}
			{coaches.length > 0 && (
				<p className="text-[13px] text-muted-foreground">
					Coaches:{" "}
					<span className="text-foreground">
						{coaches.map((coach) => coach.name).join(", ")}
					</span>
				</p>
			)}
		</section>
	);
};
