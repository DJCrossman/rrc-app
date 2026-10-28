"use client";

import { IconDots, IconMailPlus, IconMessage } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/useAuth";
import { routes } from "@/lib/routes";
import type { Member } from "@/lib/trpc/types";
import { useMemberInvites } from "../useMemberInvites";
import { useMessageMember } from "../useMessageMember";

interface MemberRowActionsProps {
	member: Member;
}

export function MemberRowActions({ member }: MemberRowActionsProps) {
	const { isAdmin } = useCurrentUser();
	const { canMessage, message, isPending } = useMessageMember();
	const { invite, resend, revoke } = useMemberInvites();
	const { athleteId, invitationId, email } = member;
	const showMessage = canMessage(member);
	const canInvite = isAdmin && member.account === "none" && !!email;
	const hasMenu = !!athleteId || showMessage || canInvite || !!invitationId;

	return (
		<div className="flex items-center justify-end gap-1">
			{showMessage && (
				<Button
					variant="ghost"
					size="icon-sm"
					className="size-7"
					aria-label={`Message ${member.name}`}
					title="Message"
					disabled={isPending}
					onClick={() => message(member)}
				>
					<IconMessage />
				</Button>
			)}
			{canInvite && email && (
				<Button
					variant="ghost"
					size="icon-sm"
					className="size-7"
					aria-label={`Invite ${member.name}`}
					title="Invite by email"
					disabled={invite.isPending}
					onClick={() => invite.mutate({ emails: [email], role: "member" })}
				>
					<IconMailPlus />
				</Button>
			)}
			{hasMenu && (
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								variant="ghost"
								size="icon-sm"
								className="size-7"
								aria-label={`More actions for ${member.name}`}
							/>
						}
					>
						<IconDots />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{athleteId && (
							<DropdownMenuItem
								render={<Link href={routes.members.view(athleteId)} />}
							>
								View details
							</DropdownMenuItem>
						)}
						{showMessage && (
							<DropdownMenuItem onClick={() => message(member)}>
								Send message
							</DropdownMenuItem>
						)}
						{isAdmin && athleteId && (
							<DropdownMenuItem
								render={<Link href={routes.members.edit(athleteId)} />}
							>
								Edit
							</DropdownMenuItem>
						)}
						{canInvite && email && (
							<DropdownMenuItem
								onClick={() =>
									invite.mutate({ emails: [email], role: "member" })
								}
							>
								Invite by email
							</DropdownMenuItem>
						)}
						{isAdmin && invitationId && (
							<>
								<DropdownMenuItem
									onClick={() => resend.mutate({ invitationId })}
								>
									Resend invitation
								</DropdownMenuItem>
								<DropdownMenuItem
									variant="destructive"
									onClick={() => revoke.mutate({ invitationId })}
								>
									Revoke invitation
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	);
}
