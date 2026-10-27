"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ChatTargetList } from "@/components/chat/chat-target-list";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { type ChatTarget, getChatTargets } from "@/lib/chat/targets";
import type { ChatChannels, ChatMembers, ChatMessage } from "@/lib/trpc/types";
import {
	type ChatTargetFormValues,
	chatTargetFormSchema,
} from "@/schemas/chat.schema";
import { getMessagePreviewText } from "../../utils/messageFormatting";

interface ForwardDialogProps {
	message: ChatMessage | null;
	sourceChannelName: string;
	channels: ChatChannels;
	members: ChatMembers;
	isLoadingMembers: boolean;
	onClose: () => void;
	onForward: (values: {
		messageId: string;
		target: ChatTarget;
		note: string;
	}) => Promise<void>;
}

export function ForwardDialog({
	message,
	onClose,
	...props
}: ForwardDialogProps) {
	return (
		<Dialog open={!!message} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="gap-4 rounded-xl sm:max-w-[480px]">
				<DialogHeader>
					<DialogTitle>Forward message</DialogTitle>
					<DialogDescription className="sr-only">
						Choose a group or person to forward this message to.
					</DialogDescription>
				</DialogHeader>
				{message && (
					<ForwardMessageForm message={message} onCancel={onClose} {...props} />
				)}
			</DialogContent>
		</Dialog>
	);
}

function ForwardMessageForm({
	message,
	sourceChannelName,
	channels,
	members,
	isLoadingMembers,
	onCancel,
	onForward,
}: Omit<ForwardDialogProps, "message" | "onClose"> & {
	message: ChatMessage;
	onCancel: () => void;
}) {
	const form = useForm<ChatTargetFormValues>({
		resolver: zodResolver(chatTargetFormSchema),
		defaultValues: { targetKey: "", note: "" },
	});
	const targetKey = useWatch({ control: form.control, name: "targetKey" });
	const targets = getChatTargets({
		channels,
		members,
		sourceChannelId: message.channelId,
	});

	return (
		<form
			onSubmit={form.handleSubmit(async ({ targetKey, note }) => {
				const target = targets.find((item) => item.key === targetKey);
				if (!target) return;
				try {
					await onForward({ messageId: message.id, target, note });
				} catch {
					form.setError("root", { message: "Couldn't forward the message" });
				}
			})}
			className="grid gap-4"
		>
			<div className="flex flex-col gap-1 rounded-[10px] border border-input bg-white/[0.03] px-3 py-2.5">
				<p className="text-xs text-muted-foreground">
					{message.author.name} in {sourceChannelName}
				</p>
				<p className="line-clamp-3 text-sm leading-normal">
					{getMessagePreviewText(message)}
				</p>
			</div>
			<div className="grid gap-1.5">
				<p className="text-[13px] font-medium">Send to</p>
				<ChatTargetList
					targets={targets}
					selectedKey={targetKey}
					isLoading={isLoadingMembers}
					onSelect={(key) =>
						form.setValue("targetKey", key, { shouldValidate: true })
					}
				/>
				{form.formState.errors.targetKey && (
					<p className="text-xs text-destructive">
						{form.formState.errors.targetKey.message}
					</p>
				)}
			</div>
			<div className="grid gap-1.5">
				<Input
					placeholder="Add a message (optional)"
					aria-label="Add a message (optional)"
					className="h-9 bg-white/[0.043] dark:bg-white/[0.043]"
					{...form.register("note")}
				/>
				{form.formState.errors.note && (
					<p className="text-xs text-destructive">
						{form.formState.errors.note.message}
					</p>
				)}
			</div>
			{form.formState.errors.root && (
				<p className="text-xs text-destructive">
					{form.formState.errors.root.message}
				</p>
			)}
			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" disabled={form.formState.isSubmitting}>
					Forward
				</Button>
			</DialogFooter>
		</form>
	);
}
