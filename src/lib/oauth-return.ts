const DEFAULT_RETURN_PATH = "/settings/apps";

/** Internal destinations an OAuth flow is allowed to return to. */
const ALLOWED_PREFIXES = ["/onboarding", "/settings/apps"];

/**
 * Validate a caller-supplied `returnTo`/`state` value against an internal
 * allowlist. Prevents an open redirect: only same-origin paths under a known
 * prefix are honoured; anything else falls back to the settings page.
 */
export function resolveOAuthReturnPath(
	value: string | null | undefined,
): string {
	if (!value || !value.startsWith("/") || value.startsWith("//")) {
		return DEFAULT_RETURN_PATH;
	}
	const isAllowed = ALLOWED_PREFIXES.some(
		(prefix) =>
			value === prefix ||
			value.startsWith(`${prefix}?`) ||
			value.startsWith(`${prefix}/`),
	);
	return isAllowed ? value : DEFAULT_RETURN_PATH;
}
