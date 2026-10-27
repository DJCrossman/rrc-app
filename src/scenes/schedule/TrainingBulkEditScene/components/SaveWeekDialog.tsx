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
import { NotifyToggle } from "../../ScheduleScene/components";
import type { SaveImpact } from "../utils/trainingRows";

interface SaveWeekDialogProps {
	impact: SaveImpact | null;
	notify: boolean;
	isSaving: boolean;
	onNotifyChange: (notify: boolean) => void;
	onConfirm: () => void;
	onClose: () => void;
}

export const SaveWeekDialog = ({
	impact,
	notify,
	isSaving,
	onNotifyChange,
	onConfirm,
	onClose,
}: SaveWeekDialogProps) => (
	<Dialog open={!!impact} onOpenChange={(open) => !open && onClose()}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Save week?</DialogTitle>
				<DialogDescription>
					This save affects sessions athletes have responded to.
				</DialogDescription>
			</DialogHeader>
			{impact && (
				<div className="space-y-4 text-sm">
					{impact.goingOnDeleted > 0 && (
						<p className="text-destructive">
							{impact.goingOnDeleted}{" "}
							{impact.goingOnDeleted === 1 ? "athlete has" : "athletes have"}{" "}
							said they're going to sessions you removed. Saving deletes those
							sessions and their RSVPs.
						</p>
					)}
					{impact.notifiableRsvps > 0 && (
						<NotifyToggle
							label={`Notify athletes about ${impact.changedSessions} changed ${impact.changedSessions === 1 ? "session" : "sessions"} (${impact.notifiableRsvps} ${impact.notifiableRsvps === 1 ? "RSVP" : "RSVPs"})`}
							checked={notify}
							onCheckedChange={onNotifyChange}
						/>
					)}
				</div>
			)}
			<DialogFooter>
				<Button variant="outline" onClick={onClose} disabled={isSaving}>
					Cancel
				</Button>
				<Button onClick={onConfirm} disabled={isSaving}>
					{isSaving ? "Saving..." : "Save week"}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
);
