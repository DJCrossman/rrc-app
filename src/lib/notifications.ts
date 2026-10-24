export const NOTIFICATION_SCOPE_ALL = "all";
export const NOTIFICATION_SCOPE_SCHEDULE = "schedule";

export const channelNotificationScope = (channelId: string) =>
	`channel:${channelId}`;

export type NotificationPreferences = Record<string, boolean>;

export type NotificationPreferenceRow = {
	athleteId: string;
	scope: string;
	enabled: boolean;
};

export type PushMessage = {
	title: string;
	body: string;
	url: string;
	tag?: string;
	scope?: string;
};

export type PushPayload = {
	title: string;
	body: string;
	url: string;
	tag?: string;
	icon: string;
};

export function isNotificationEnabled(
	preferences: NotificationPreferences,
	scope?: string,
): boolean {
	if (preferences[NOTIFICATION_SCOPE_ALL] === false) return false;
	if (scope && preferences[scope] === false) return false;
	return true;
}

export function filterNotificationRecipients(
	athleteIds: string[],
	preferenceRows: NotificationPreferenceRow[],
	scope?: string,
): string[] {
	const byAthlete = new Map<string, NotificationPreferences>();
	for (const row of preferenceRows) {
		const preferences = byAthlete.get(row.athleteId) ?? {};
		preferences[row.scope] = row.enabled;
		byAthlete.set(row.athleteId, preferences);
	}
	return [...new Set(athleteIds)].filter((athleteId) =>
		isNotificationEnabled(byAthlete.get(athleteId) ?? {}, scope),
	);
}

export function buildPushPayload(message: PushMessage): string {
	const payload: PushPayload = {
		title: truncate(message.title, MAX_TITLE_LENGTH),
		body: truncate(message.body, MAX_BODY_LENGTH),
		url: toAppPath(message.url),
		icon: NOTIFICATION_ICON,
	};
	if (message.tag) payload.tag = message.tag;
	return JSON.stringify(payload);
}

export function isPushServiceEndpoint(endpoint: string): boolean {
	let url: URL;
	try {
		url = new URL(endpoint);
	} catch {
		return false;
	}
	if (url.protocol !== "https:") return false;
	return PUSH_SERVICE_HOSTS.some(
		(host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
	);
}

const NOTIFICATION_ICON = "/logo.png";
const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 400;

const PUSH_SERVICE_HOSTS = [
	"fcm.googleapis.com",
	"android.googleapis.com",
	"push.services.mozilla.com",
	"push.apple.com",
	"notify.windows.com",
];

function truncate(value: string, maxLength: number) {
	const trimmed = value.trim();
	if (trimmed.length <= maxLength) return trimmed;
	return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

function toAppPath(url: string) {
	return url.startsWith("/") && !url.startsWith("//") ? url : "/";
}
