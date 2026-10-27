import { useState } from "react";
import { DEFAULT_FREQUENT_EMOJI } from "./emojiData";

const STORAGE_KEY = "rrc.chat.emojiUsage";
const FREQUENT_COUNT = 18;

export function useFrequentEmoji() {
	const [usage, setUsage] = useState<Record<string, number>>(readUsage);
	const frequent = [
		...Object.entries(usage)
			.sort(([, a], [, b]) => b - a)
			.map(([emoji]) => emoji),
		...DEFAULT_FREQUENT_EMOJI,
	]
		.filter((emoji, index, all) => all.indexOf(emoji) === index)
		.slice(0, FREQUENT_COUNT);

	const recordUse = (emoji: string) => {
		const next = { ...usage, [emoji]: (usage[emoji] ?? 0) + 1 };
		setUsage(next);
		try {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		} catch {
			// Storage can be unavailable (private browsing); usage just won't persist.
		}
	};

	return { frequent, recordUse };
}

function readUsage(): Record<string, number> {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}
