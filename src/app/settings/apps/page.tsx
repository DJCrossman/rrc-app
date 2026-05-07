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
		authType: "oauth",
		authUrl: "/api/v1/concept2/authorize",
	},
	{
		id: "strava",
		name: "Strava",
		description:
			"Connect your Strava account to sync activities and training data",
		authType: "oauth",
		authUrl: "/api/v1/strava/authorize",
	},
	{
		id: "rca",
		name: "Rowing Canada",
		description:
			"Connect your Rowing Canada membership to sync registration data",
		authType: "credentials",
		connectUrl: "/api/v1/rca/connect",
	},
];

export default function AppsPage() {
	return <AccountAppsScene integrations={IntegrationApplications} />;
}
