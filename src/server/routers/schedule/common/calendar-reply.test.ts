import { describe, expect, it } from "vitest";
import {
	describeReply,
	formatCalendarReplyText,
	parseCalendarReplyStatus,
} from "./calendar-reply";
import { escapeHtml, renderCalendarReplyPage } from "./calendar-reply-page";

const replyUrl = "https://rrc.test/api/v1/calendar/tok/rsvp/evt_1";

describe("formatCalendarReplyText", () => {
	it("lists going, maybe and can't-go links with the current reply", () => {
		expect(
			formatCalendarReplyText({ replyUrl, type: "training", status: "maybe" }),
		).toBe(
			[
				"Your reply: Maybe",
				`Going: ${replyUrl}?status=yes`,
				`Maybe: ${replyUrl}?status=maybe`,
				`Can't go: ${replyUrl}?status=no`,
			].join("\n"),
		);
	});

	it("offers sign up and withdraw for volunteer shifts", () => {
		expect(
			formatCalendarReplyText({ replyUrl, type: "volunteer", status: null }),
		).toBe(
			[
				"Your reply: Not signed up",
				`Sign up: ${replyUrl}?status=yes`,
				`Withdraw: ${replyUrl}?status=none`,
			].join("\n"),
		);
	});
});

describe("describeReply", () => {
	it("describes every reply state", () => {
		expect(describeReply("training", null)).toBe("No reply yet");
		expect(describeReply("regatta", "yes")).toBe("Going");
		expect(describeReply("training", "no")).toBe("Can't go");
		expect(describeReply("volunteer", "yes")).toBe("Signed up");
	});
});

describe("parseCalendarReplyStatus", () => {
	it("accepts known statuses and rejects anything else", () => {
		expect(parseCalendarReplyStatus("yes")).toBe("yes");
		expect(parseCalendarReplyStatus("none")).toBe("none");
		expect(parseCalendarReplyStatus("YES")).toBeNull();
		expect(parseCalendarReplyStatus(null)).toBeNull();
	});
});

describe("renderCalendarReplyPage", () => {
	it("escapes event text and posts the chosen reply", () => {
		const html = renderCalendarReplyPage({
			title: `Erg <b>"test"</b>`,
			message: "Your reply: Going",
			type: "training",
			highlight: "maybe",
		});
		expect(html).toContain("Erg &lt;b&gt;&quot;test&quot;&lt;/b&gt;");
		expect(html).toContain('<form method="post">');
		expect(html).toContain(
			'<button type="submit" name="status" value="maybe" class="primary">Maybe</button>',
		);
	});

	it("shows no reply buttons when there is no event", () => {
		expect(
			renderCalendarReplyPage({ title: "Link not found", message: "Gone" }),
		).not.toContain("<form");
	});

	it("escapes quotes and ampersands", () => {
		expect(escapeHtml(`Tom & Jerry's "cup"`)).toBe(
			"Tom &amp; Jerry&#39;s &quot;cup&quot;",
		);
	});
});
