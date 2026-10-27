import { UserPlus } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";

export const AthleteProfilePrompt = ({ className }: { className?: string }) => (
	<Alert className={className}>
		<UserPlus />
		<AlertTitle>No athlete profile yet</AlertTitle>
		<AlertDescription>
			<span>
				You're signed in as an admin without an athlete profile. Create one to
				log activities, connect apps and appear on the leaderboard.
			</span>
			<Button asChild variant="outline" size="sm" className="mt-2 w-fit">
				<Link href={routes.onboarding.start()}>Create athlete profile</Link>
			</Button>
		</AlertDescription>
	</Alert>
);
