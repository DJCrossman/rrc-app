import { DateTime } from "luxon";

const WEEKDAYS = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
];

const MAX_REPEAT_MONTHS = 12;

// Turns the days a model read from a prompt ("Tuesday", "tomorrow",
// "2026-11-14") into dates, counting weekdays forward from the start date so
// a small model never has to do calendar arithmetic. Weekdays repeat every
// week through `until` when the session runs for more than one week; dated
// days repeat too when `repeatDates` is set.
export function resolvePromptDays(
	days: string[],
	startDate: string,
	until?: string,
	{ repeatDates = false }: { repeatDates?: boolean } = {},
): string[] {
	const start = DateTime.fromISO(startDate);
	const end = until ? DateTime.fromISO(until) : start.plus({ days: 6 });
	const weekly = (first: DateTime) => {
		const dates: DateTime[] = [];
		for (let date = first; date <= end; date = date.plus({ weeks: 1 })) {
			dates.push(date);
		}
		return dates;
	};
	const dates = days.flatMap((day) => {
		const value = day.trim().toLowerCase();
		const weekdayIndex = findWeekday(value);
		if (weekdayIndex >= 0) {
			return weekly(
				start.plus({ days: (weekdayIndex + 1 - start.weekday + 7) % 7 }),
			);
		}
		const date =
			value === "today"
				? start
				: value === "tomorrow"
					? start.plus({ days: 1 })
					: DateTime.fromISO(value);
		if (!date.isValid) return [];
		return repeatDates ? weekly(date) : [date];
	});
	return [...new Set(dates.map((date) => date.toISODate() ?? ""))]
		.filter(Boolean)
		.sort();
}

// The last date a repeating session runs, from what the model read: a date
// ("2027-03-31"), a month ("March" — its last day, or "Dec 18") or a number
// of weeks.
// Models often get the year wrong, so a date already behind the start rolls
// forward a year, and nothing repeats past a year out.
export function resolvePromptUntil(
	{ until, weeks }: { until?: string; weeks?: number },
	startDate: string,
): string | undefined {
	const start = DateTime.fromISO(startDate);
	let end: DateTime | undefined;
	if (weeks && weeks > 1) {
		end = start.plus({ weeks }).minus({ days: 1 });
	} else if (until) {
		const value = until.trim().toLowerCase();
		const monthIndex = findMonth(value);
		const day = Number(value.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/)?.[1]);
		const month = start.set({ month: monthIndex + 1 });
		const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
			? DateTime.fromISO(value)
			: monthIndex < 0
				? DateTime.invalid("Unknown month")
				: day >= 1 && day <= (month.daysInMonth ?? 31)
					? month.set({ day })
					: month.endOf("month");
		if (date.isValid) {
			end = date;
			while (end < start) end = end.plus({ years: 1 });
		}
	}
	if (!end) return undefined;
	const latest = start.plus({ months: MAX_REPEAT_MONTHS });
	return (end > latest ? latest : end).toISODate() ?? undefined;
}

// A range written once for the whole prompt ("…all until the end of March")
// applies to every weekly session, since a small model tends to attach it to
// the first session only. Two different ranges are left to the model.
export function findPromptRange(
	prompt: string,
	startDate: string,
): string | undefined {
	const text = prompt.toLowerCase();
	const ends = new Set<string>();
	for (const [, until] of text.matchAll(
		/\b(?:until|till|through|thru)\s+(?:the\s+)?(?:end\s+of\s+)?(\d{4}-\d{2}-\d{2}|[a-z]+\.?(?:\s+\d{1,2}(?:st|nd|rd|th)?)?)/g,
	)) {
		const end = resolvePromptUntil({ until }, startDate);
		if (end) ends.add(end);
	}
	for (const [, weeks] of text.matchAll(/\bfor\s+(\d+)\s+weeks?\b/g)) {
		const end = resolvePromptUntil({ weeks: Number(weeks) }, startDate);
		if (end) ends.add(end);
	}
	return ends.size === 1 ? [...ends][0] : undefined;
}

// Whether the prompt asks for everything in it to repeat ("repeat every week
// until…", "weekly through…"), dated events included.
export function isRepeatPrompt(prompt: string): boolean {
	return /\b(?:repeat(?:s|ed|ing)?|every\s+week|weekly)\b/i.test(prompt);
}

function findWeekday(value: string) {
	return WEEKDAYS.findIndex(
		(weekday) => value.length >= 3 && weekday.startsWith(value.slice(0, 3)),
	);
}

function findMonth(value: string) {
	const months = Array.from({ length: 12 }, (_, index) =>
		DateTime.fromObject({ month: index + 1 })
			.toFormat("LLLL")
			.toLowerCase(),
	);
	for (const word of value.split(/[^a-z]+/)) {
		if (word.length < 3) continue;
		const index = months.findIndex((month) => month.startsWith(word));
		if (index >= 0) return index;
	}
	return -1;
}
