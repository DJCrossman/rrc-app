"use client";

import { Button } from "@/components/ui/button";

interface WelcomeStepProps {
	isAdmin: boolean;
	onNext: () => void;
	onSkipToApp: () => void;
}

export function WelcomeStep({
	isAdmin,
	onNext,
	onSkipToApp,
}: WelcomeStepProps) {
	if (isAdmin) {
		return (
			<div className="space-y-6">
				<div className="space-y-2">
					<h2 className="text-2xl font-semibold">Welcome to the club</h2>
					<p className="text-muted-foreground">
						You have admin access. Some features — like tracking your own
						workouts and activities — need an athlete profile. You can set one
						up now, or skip and do it later.
					</p>
				</div>
				<div className="flex items-center justify-end gap-2">
					<Button variant="ghost" onClick={onSkipToApp}>
						Skip for now
					</Button>
					<Button onClick={onNext}>Set up my athlete profile</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h2 className="text-2xl font-semibold">Welcome to the club</h2>
				<p className="text-muted-foreground">
					Let's set up your athlete profile and connect your training apps. It
					only takes a minute.
				</p>
			</div>
			<div className="flex items-center justify-end">
				<Button onClick={onNext}>Get started</Button>
			</div>
		</div>
	);
}
