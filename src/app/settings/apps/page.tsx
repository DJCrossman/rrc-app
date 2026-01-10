import {
	AccountAppsScene,
	type IntegrationApplication,
} from "@/scenes/settings";

const IntegrationApplications: IntegrationApplication[] = [
	{
		id: "concept2",
		name: "Concept2",
		description:
			"Sync your erg workouts and performance data from Concept2 Logbook",
		authUrl: "/api/v1/concept2/authorize",
	},
	{
		id: "strava",
		name: "Strava",
		description:
			"Connect your Strava account to sync activities and training data",
		authUrl: "/api/v1/strava/authorize",
	},
];

export default function AppsPage() {
	return <AccountAppsScene integrations={IntegrationApplications} />;
}
