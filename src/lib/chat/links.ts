export type LinkTarget = { kind: "event" | "activity"; id: string };

type TextPart = { kind: "text" | "url"; value: string };

const URL_PATTERN = /https?:\/\/[^\s<>"]+|(?<=^|\s)\/[^\s<>"]+/g;
const TRAILING_PUNCTUATION = /[.,!?;:)\]]+$/;
const ID_PATTERN = /^[A-Za-z0-9_]+/;
const MAX_LINK_TARGETS = 3;
const LINKABLE_PAGES: Record<
	string,
	{ kind: LinkTarget["kind"]; param: string }
> = {
	"/schedule": { kind: "event", param: "eventId" },
	"/activities": { kind: "activity", param: "activityId" },
};

export function splitTextByUrls(text: string): TextPart[] {
	const parts: TextPart[] = [];
	let cursor = 0;
	for (const match of text.matchAll(URL_PATTERN)) {
		const url = match[0].replace(TRAILING_PUNCTUATION, "");
		if (match.index > cursor) {
			parts.push({ kind: "text", value: text.slice(cursor, match.index) });
		}
		parts.push({ kind: "url", value: url });
		cursor = match.index + url.length;
	}
	if (cursor < text.length) {
		parts.push({ kind: "text", value: text.slice(cursor) });
	}
	return parts;
}

export function extractLinkTargets(text: string): LinkTarget[] {
	const targets = new Map<string, LinkTarget>();
	for (const part of splitTextByUrls(text)) {
		const target = part.kind === "url" ? parseLinkTarget(part.value) : null;
		if (target) {
			targets.set(`${target.kind}:${target.id}`, target);
		}
	}
	return [...targets.values()].slice(0, MAX_LINK_TARGETS);
}

function parseLinkTarget(url: string): LinkTarget | null {
	let parsed: URL;
	try {
		parsed = new URL(url, "http://app.local");
	} catch {
		return null;
	}
	const page = LINKABLE_PAGES[parsed.pathname];
	const id =
		page && parsed.searchParams.get(page.param)?.match(ID_PATTERN)?.[0];
	return page && id ? { kind: page.kind, id } : null;
}
