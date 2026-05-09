#!/usr/bin/env bun

const STRAVA_PUSH_SUBSCRIPTIONS_URL =
	"https://www.strava.com/api/v3/push_subscriptions";

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

	const flags = parseFlags(process.argv.slice(2));
	const callbackUrl =
		flags["callback-url"] ?? process.env.STRAVA_WEBHOOK_CALLBACK_URL;
	if (!callbackUrl) {
		console.error(
			"❌ Missing callback URL. Pass --callback-url=<url> or set STRAVA_WEBHOOK_CALLBACK_URL in your .env file.",
		);
		process.exit(1);
	}

	const verifyTokenSource = flags["verify-token"]
		? "flag"
		: process.env.STRAVA_WEBHOOK_VERIFY_TOKEN
			? "env"
			: "generated";
	const verifyToken =
		flags["verify-token"] ??
		process.env.STRAVA_WEBHOOK_VERIFY_TOKEN ??
		crypto.randomUUID();

	console.log("📡 Creating Strava push subscription...");
	console.log(`   callback_url:  ${callbackUrl}`);
	console.log(
		`   verify_token:  ${verifyToken}${verifyTokenSource === "generated" ? "  (generated — save this to STRAVA_WEBHOOK_VERIFY_TOKEN)" : ""}`,
	);

	const body = new FormData();
	body.set("client_id", clientId);
	body.set("client_secret", clientSecret);
	body.set("callback_url", callbackUrl);
	body.set("verify_token", verifyToken);

	const res = await fetch(STRAVA_PUSH_SUBSCRIPTIONS_URL, {
		method: "POST",
		body,
	});
	const text = await res.text();

	if (!res.ok) {
		console.error(`\n❌ Strava returned ${res.status} ${res.statusText}`);
		console.error(text);
		if (res.status === 400 && text.toLowerCase().includes("already exists")) {
			console.error(
				"\nℹ️  An app can only have one subscription. Run 'bun run strava:webhook:list' to see it; delete it via the Strava API before re-running setup.",
			);
		}
		process.exit(1);
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		console.error("❌ Strava returned non-JSON response:");
		console.error(text);
		process.exit(1);
	}

	const id = (parsed as { id?: number }).id;
	console.log(`\n✅ Subscription created. id=${id}`);
	if (verifyTokenSource === "generated") {
		console.log(
			"\nℹ️  Save STRAVA_WEBHOOK_VERIFY_TOKEN in your .env so the webhook handler can validate the token on the GET challenge.",
		);
	}
}

function parseFlags(argv: string[]): Record<string, string> {
	const out: Record<string, string> = {};
	for (const arg of argv) {
		if (!arg.startsWith("--")) continue;
		const eq = arg.indexOf("=");
		if (eq === -1) {
			out[arg.slice(2)] = "true";
		} else {
			out[arg.slice(2, eq)] = arg.slice(eq + 1);
		}
	}
	return out;
}

main();
