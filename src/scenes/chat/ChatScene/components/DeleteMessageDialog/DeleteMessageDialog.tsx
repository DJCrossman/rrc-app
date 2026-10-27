"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface DeleteMessageDialogProps {
	isOpen: boolean;
	isDeleting: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export function DeleteMessageDialog({
	isOpen,
	isDeleting,
	onClose,
	onConfirm,
}: DeleteMessageDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Delete message?</DialogTitle>
					<DialogDescription>
						This removes the message for everyone. Replies in its thread stay
						visible.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={onConfirm}
						disabled={isDeleting}
					>
						Delete
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
