import { expect, test } from "@playwright/test";
import { signInAs } from "./sign-in";

test("a member's 2K and 6K tiles lead with the split, then the total time", async ({
	page,
}) => {
	await signInAs(page, "admin");
	await page.goto("/members");
	await page.getByRole("link", { name: "Morgan Oarsby" }).click();

	const details = page.getByRole("dialog");
	for (const title of ["Last 2K", "Best 2K", "Last 6K", "Best 6K"]) {
		await expect(
			details.getByText(title, { exact: true }).locator(".."),
		).toHaveText(
			new RegExp(`^${title}\\d+:\\d{2}\\.\\d/500m\\d{2}:\\d{2}\\.\\d · `),
		);
	}
});
