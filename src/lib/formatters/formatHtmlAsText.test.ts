import { describe, expect, it } from "vitest";
import { formatHtmlAsText } from "./formatHtmlAsText";

describe("formatHtmlAsText", () => {
	it("turns RCA program description markup into plain lines", () => {
		const html =
			'<div><b><font face="verdana, arial">Club Membership </font></b></div>' +
			'<div><u><font face="verdana">Membership Details:</font></u></div>' +
			'<div><font face="verdana">The Club Membership </font>' +
			'<span style="font-size: 1em; margin: 0px;">includes RCA &amp; SRA fees.</span></div>';

		expect(formatHtmlAsText(html)).toBe(
			"Club Membership\nMembership Details:\nThe Club Membership includes RCA & SRA fees.",
		);
	});

	it("breaks lines on <br> and paragraphs and drops empty lines", () => {
		expect(formatHtmlAsText("<p>One<br>Two</p><p>&nbsp;</p><p>Three</p>")).toBe(
			"One\nTwo\nThree",
		);
	});

	it("decodes named and numeric entities", () => {
		expect(
			formatHtmlAsText("Fees &lt;$50&gt; &#8211; &#x2014; &quot;ok&quot;"),
		).toBe('Fees <$50> – — "ok"');
	});

	it("leaves unknown or invalid entities as written", () => {
		expect(formatHtmlAsText("A &bogus; B &#0; C")).toBe("A &bogus; B &#0; C");
	});

	it("returns plain text unchanged apart from whitespace", () => {
		expect(formatHtmlAsText("  Learn to  Row  ")).toBe("Learn to Row");
	});
});
