"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DoneStepProps {
	isAdmin: boolean;
	isFinishing: boolean;
	onFinish: () => void;
}

export function DoneStep({ isAdmin, isFinishing, onFinish }: DoneStepProps) {
	return (
		<div className="space-y-6 text-center">
			<div className="flex justify-center">
				<CheckCircle2 className="h-12 w-12 text-primary" />
			</div>
			<div className="space-y-2">
				<h2 className="text-2xl font-semibold">You're all set</h2>
				<p className="text-muted-foreground">
					{isAdmin
						? "Your profile is ready."
						: "Your profile is ready. You can connect more apps any time from Settings → Apps."}
				</p>
			</div>
			<div className="flex items-center justify-center">
				<Button onClick={onFinish} disabled={isFinishing}>
					{isFinishing ? "Finishing…" : "Go to app"}
				</Button>
			</div>
		</div>
	);
}
