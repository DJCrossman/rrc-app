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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	type InviteMembers,
	type InviteMembersFormInput,
	InviteRoles,
	inviteMembersFormSchema,
} from "@/schemas";

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
							<Select
								items={InviteRoles.map((role) => ({
									value: role,
									label: role === "admin" ? "Admin" : "Member",
								}))}
								onValueChange={field.onChange}
								value={field.value}
							>
								<FormControl>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{InviteRoles.map((role) => (
										<SelectItem key={role} value={role}>
											{role === "admin" ? "Admin" : "Member"}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button type="submit" disabled={form.formState.isSubmitting}>
						Send invitations
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
