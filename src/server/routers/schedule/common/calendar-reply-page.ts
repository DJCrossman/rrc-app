import type { EventType } from "@/schemas";
import {
	type CalendarReplyStatus,
	getCalendarReplyOptions,
} from "./calendar-reply";

export function renderCalendarReplyPage({
	title,
	subtitle,
	message,
	type,
	highlight,
}: {
	title: string;
	subtitle?: string;
	message: string;
	type?: EventType;
	highlight?: CalendarReplyStatus | null;
}) {
	const buttons = type
		? getCalendarReplyOptions(type)
				.map(
					(option) =>
						`<button type="submit" name="status" value="${option.status}"${option.status === highlight ? ' class="primary"' : ""}>${escapeHtml(option.label)}</button>`,
				)
				.join("")
		: "";
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · Regina Rowing Club</title>
<style>
body{margin:0;font-family:system-ui,sans-serif;background:#18181b;color:#fafafa;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}
main{max-width:420px;width:100%;background:#27272a;border:1px solid #3f3f46;border-radius:12px;padding:24px}
h1{font-size:20px;margin:0 0 4px}p{margin:8px 0;color:#d4d4d8}.subtitle{color:#a1a1aa;margin-top:0}
form{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
button{flex:1;min-width:96px;padding:10px 12px;border-radius:8px;border:1px solid #52525b;background:#3f3f46;color:#fafafa;font-size:14px;cursor:pointer}
button.primary{background:#fafafa;color:#18181b;border-color:#fafafa}
</style>
</head>
<body>
<main>
<h1>${escapeHtml(title)}</h1>
${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ""}
<p>${escapeHtml(message)}</p>
${buttons ? `<form method="post">${buttons}</form>` : ""}
</main>
</body>
</html>`;
}

export function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}
