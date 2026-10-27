import { headers } from "next/headers";

export async function getRequestOrigin(): Promise<string> {
	const requestHeaders = await headers();
	const host =
		requestHeaders.get("x-forwarded-host")?.split(",")[0].trim() ||
		requestHeaders.get("host") ||
		"localhost:3000";
	const protocol =
		requestHeaders.get("x-forwarded-proto")?.split(",")[0].trim() ||
		(host.startsWith("localhost") ? "http" : "https");
	return `${protocol}://${host}`;
}
