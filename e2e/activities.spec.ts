import { expect, test } from "@playwright/test";
import { signInAs } from "./sign-in";

test("admin filters activities down to 2K and 6K tests", async ({ page }) => {
	await signInAs(page, "admin");
	await page.goto("/activities");

	const activities = page
		.getByRole("listitem")
		.filter({ has: page.getByRole("heading", { level: 2 }) })
		.getByRole("link");
	await expect(activities.first()).toBeVisible();

	await page.getByRole("button", { name: "2K", exact: true }).click();
	await expect(
		page.getByRole("button", { name: "2K", exact: true, pressed: true }),
	).toBeVisible();
	await expect(
		activities.filter({ hasNot: page.getByText(/^2,?000\s?m$/) }),
	).toHaveCount(0);
	await expect(activities.first()).toBeVisible();

	await page.getByRole("button", { name: "6K", exact: true }).click();
	await expect(
		page.getByRole("button", { name: "6K", exact: true, pressed: true }),
	).toBeVisible();
	await expect(
		activities.filter({ hasNot: page.getByText(/^6,?000\s?m$/) }),
	).toHaveCount(0);
	await expect(activities.first()).toBeVisible();
});

test("member's interval session is not listed as a 2K test", async ({
	page,
}) => {
	await signInAs(page, "member");
	await page.goto("/activities");

	const activities = page
		.getByRole("listitem")
		.filter({ has: page.getByRole("heading", { level: 2 }) })
		.getByRole("link");
	await expect(activities.filter({ hasText: "4 x 500m" })).toHaveCount(1);

	await page.getByRole("button", { name: "2K", exact: true }).click();
	await expect(
		page.getByRole("button", { name: "2K", exact: true, pressed: true }),
	).toBeVisible();
	await expect(activities.filter({ hasText: "4 x 500m" })).toHaveCount(0);
	await expect(activities.first()).toBeVisible();
});

test("an activity's details open from its row before the server responds", async ({
	page,
}) => {
	await signInAs(page, "member");
	await page.goto("/activities");

	let respond = () => {};
	const response = new Promise<void>((resolve) => {
		respond = resolve;
	});
	await page.route(/activityId=/, async (route) => {
		await response;
		await route.continue();
	});

	await page
		.getByRole("listitem")
		.filter({ has: page.getByRole("heading", { level: 2 }) })
		.getByRole("link")
		.filter({ hasText: "4 x 500m" })
		.click();
	const details = page.getByRole("dialog");
	await expect(
		details.getByRole("heading", { name: "4 x 500m" }),
	).toBeVisible();
	expect(page.url()).not.toContain("activityId=");

	respond();
	await expect(page).toHaveURL(/activityId=/);
	await expect(
		details.getByRole("heading", { name: "4 x 500m" }),
	).toBeVisible();

	await details.getByRole("button", { name: "Close", exact: true }).click();
	await expect(details).toBeHidden();
	await expect(page).not.toHaveURL(/activityId=/);
});
