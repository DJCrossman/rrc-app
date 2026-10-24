export function getRequestOrigin(request: Request) {
	const url = new URL(request.url);
	const host =
		request.headers.get("x-forwarded-host") ?? request.headers.get("host");
	if (!host) {
		return url.origin;
	}
	const protocol =
		request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
		url.protocol.replace(":", "");
	return `${protocol}://${host}`;
}
