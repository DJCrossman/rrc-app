export function getStravaConfig() {
	const clientId = process.env.STRAVA_CLIENT_ID;
	const clientSecret = process.env.STRAVA_CLIENT_SECRET;
	const callbackUrl =
		process.env.STRAVA_CALLBACK_URL ||
		"http://localhost:3000/api/v1/strava/callback";

	if (!clientId || !clientSecret) {
		throw new Error("Strava OAuth credentials not configured");
	}

	return {
		clientId,
		clientSecret,
		callbackUrl,
		authUrl: "https://www.strava.com/oauth/authorize",
		tokenUrl: "https://www.strava.com/api/v3/oauth/token",
		baseApiUrl: "https://www.strava.com/api/v3",
	};
}
