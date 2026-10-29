"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
	type InviteMembers,
	type InviteMembersFormInput,
	type InviteRole,
	inviteMembersFormSchema,
} from "@/schemas";

const ROLE_OPTIONS: {
	value: InviteRole;
	title: string;
	description: string;
}[] = [
	{
		value: "member",
		title: "Member",
		description: "Sees the schedule, chat and their own activities",
	},
	{
		value: "admin",
		title: "Admin",
		description: "Also manages members, groups, boats and events",
	},
];

interface InviteMemberDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: InviteMembers) => Promise<unknown>;
}

export function InviteMemberDialog({
	isOpen,
	onClose,
	onSubmit,
}: InviteMemberDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Invite members</DialogTitle>
					<DialogDescription>
						Each person gets an email with a link to create their account and
						finish their profile.
					</DialogDescription>
				</DialogHeader>
				{isOpen && <InviteMemberForm onSubmit={onSubmit} onCancel={onClose} />}
			</DialogContent>
		</Dialog>
	);
}

function InviteMemberForm({
	onSubmit,
	onCancel,
}: Pick<InviteMemberDialogProps, "onSubmit"> & { onCancel: () => void }) {
	const form = useForm<InviteMembersFormInput>({
		resolver: zodResolver(inviteMembersFormSchema, undefined, { raw: true }),
		defaultValues: { emails: "", role: "member" },
	});

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((values) =>
					onSubmit(inviteMembersFormSchema.parse(values)).catch(
						() => undefined,
					),
				)}
				className="space-y-4"
			>
				<FormField
					control={form.control}
					name="emails"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Emails</FormLabel>
							<FormControl>
								<Textarea
									autoFocus
									rows={4}
									placeholder={
										"rower@example.com, coach@example.com\nOne per line or separated by commas"
									}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="role"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Invite as</FormLabel>
							<FormControl>
								<div className="flex flex-col gap-2">
									{ROLE_OPTIONS.map((option) => {
										const isSelected = field.value === option.value;
										return (
											<label
												key={option.value}
												className={cn(
													"flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors hover:bg-muted has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50",
													isSelected &&
														"border-blue-600 bg-blue-500/10 dark:border-blue-400 dark:bg-blue-500/20",
												)}
											>
												<input
													type="radio"
													name={field.name}
													value={option.value}
													checked={isSelected}
													onChange={() => field.onChange(option.value)}
													className="sr-only"
												/>
												<span
													aria-hidden
													className={cn(
														"flex size-5 shrink-0 items-center justify-center rounded-full border",
														isSelected
															? "border-blue-600 dark:border-blue-400"
															: "border-muted-foreground/50",
													)}
												>
													{isSelected && (
														<span className="size-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
													)}
												</span>
												<span className="flex min-w-0 flex-col gap-0.5">
													<span className="font-semibold">{option.title}</span>
													<span className="text-sm text-muted-foreground">
														{option.description}
													</span>
												</span>
											</label>
										);
									})}
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<DialogFooter className="max-sm:flex-row">
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button
						type="submit"
						className="max-sm:flex-1"
						disabled={form.formState.isSubmitting}
					>
						Send invitations
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
