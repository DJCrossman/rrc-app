#!/usr/bin/env bun

const STRAVA_PUSH_SUBSCRIPTIONS_URL =
	"https://www.strava.com/api/v3/push_subscriptions";

type Subscription = {
	id: number;
	resource_state?: number;
	application_id?: number;
	callback_url: string;
	created_at: string;
	updated_at: string;
};

async function main() {
	const clientId = process.env.STRAVA_CLIENT_ID;
	const clientSecret = process.env.STRAVA_CLIENT_SECRET;
	if (!clientId) {
		console.error("❌ STRAVA_CLIENT_ID is not set. Add it to your .env file.");
		process.exit(1);
	}
	if (!clientSecret) {
		console.error(
			"❌ STRAVA_CLIENT_SECRET is not set. Add it to your .env file.",
		);
		process.exit(1);
	}

	const url = new URL(STRAVA_PUSH_SUBSCRIPTIONS_URL);
	url.searchParams.set("client_id", clientId);
	url.searchParams.set("client_secret", clientSecret);

	console.log("📡 Fetching Strava push subscriptions...");
	const res = await fetch(url);
	const text = await res.text();

	if (!res.ok) {
		console.error(`\n❌ Strava returned ${res.status} ${res.statusText}`);
		console.error(text);
		process.exit(1);
	}

	let subscriptions: Subscription[];
	try {
		subscriptions = JSON.parse(text) as Subscription[];
	} catch {
		console.error("❌ Strava returned non-JSON response:");
		console.error(text);
		process.exit(1);
	}

	if (subscriptions.length === 0) {
		console.log("\n(no subscriptions registered)");
		console.log(
			"Run 'bun run strava:webhook:setup --callback-url=<url>' to create one.",
		);
		return;
	}

	console.log(`\nFound ${subscriptions.length} subscription(s):\n`);
	for (const sub of subscriptions) {
		console.log(`  id:           ${sub.id}`);
		console.log(`  callback_url: ${sub.callback_url}`);
		console.log(`  created_at:   ${sub.created_at}`);
		console.log(`  updated_at:   ${sub.updated_at}`);
		console.log("");
	}
}

main();
