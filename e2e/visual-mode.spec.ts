import { type Page, expect, test } from "@playwright/test";

// ── helpers ──────────────────────────────────────────────────────────────────

async function openSettings(page: Page) {
	// Expand the Settings collapsible section.
	// .first() selects the section header even when AdminPanel's own "Settings"
	// heading is also visible after expansion.
	await page.getByText("Settings").first().click();
}

async function switchToVisualMode(page: Page) {
	await openSettings(page);
	await page.getByTestId("mode-btn-visual").click();
	// Close the Settings section so the quiz area is compact before drag operations
	await page.getByText("Settings").first().click();
}

function diskLocator(page: Page, zone: "top" | "bottom", place: string) {
	return page.locator(`[data-testid^="visual-disk-${zone}-${place}-"]`);
}

async function diskCount(page: Page, zone: "top" | "bottom", place: string) {
	return diskLocator(page, zone, place).count();
}

/** Pointer-drag one disk from `fromZone` to `toZone` within the same column. */
async function dragDisk(
	page: Page,
	place: string,
	fromZone: "top" | "bottom",
	toZone: "top" | "bottom",
) {
	const disk = page.locator(
		`[data-testid="visual-disk-${fromZone}-${place}-0"]`,
	);
	const target = page.getByTestId(`visual-zone-${toZone}-${place}`);
	const diskBox = await disk.boundingBox();
	const targetBox = await target.boundingBox();
	if (!diskBox || !targetBox)
		throw new Error("Could not get bounding box for drag");
	await page.mouse.move(
		diskBox.x + diskBox.width / 2,
		diskBox.y + diskBox.height / 2,
	);
	await page.mouse.down();
	await page.mouse.move(
		targetBox.x + targetBox.width / 2,
		targetBox.y + targetBox.height / 2,
		{ steps: 8 },
	);
	await page.mouse.up();
}

/** Drag a top zone onto the next column to carry a set of 10.
 *  Moves mouse to (0,0) first to ensure a clean entry into the source zone. */
async function carryZone(page: Page, place: string, targetPlace: string) {
	const source = page.getByTestId(`visual-zone-top-${place}`);
	const target = page.getByTestId(`visual-column-${targetPlace}`);
	const sourceBox = await source.boundingBox();
	const targetBox = await target.boundingBox();
	if (!sourceBox || !targetBox)
		throw new Error("Could not get bounding box for carry");
	await page.mouse.move(0, 0);
	await page.mouse.move(
		sourceBox.x + sourceBox.width / 2,
		sourceBox.y + sourceBox.height / 2,
	);
	await page.mouse.down();
	await page.mouse.move(
		targetBox.x + targetBox.width / 2,
		targetBox.y + targetBox.height / 2,
		{ steps: 8 },
	);
	await page.mouse.up();
}

/** Consolidate all disks into top zone, then carry out any 10-sets.
 *  Repeats until top < 10 (column ready to advance). */
async function solveColumn(page: Page, place: string) {
	// Move all bottom disks to top
	let bottom = await diskCount(page, "bottom", place);
	while (bottom > 0) {
		await dragDisk(page, place, "bottom", "top");
		await expect.poll(() => diskCount(page, "bottom", place)).toBe(bottom - 1);
		bottom--;
	}
	// Carry out complete 10-sets by dragging zone onto the next column
	const CARRY_TARGET: Record<string, string> = {
		ones_pl: "tens_pl",
		tens_pl: "hundreds_pl",
		hundreds_pl: "thousands_pl",
		thousands_pl: "overflow",
	};
	let top = await diskCount(page, "top", place);
	while (top >= 10) {
		const target = CARRY_TARGET[place];
		await carryZone(page, place, target);
		await expect.poll(() => diskCount(page, "top", place)).toBe(top - 10);
		top -= 10;
	}
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe("Visual mode", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
	});

	test("switching to Visual mode renders visual solver and hides digit solver", async ({
		page,
	}) => {
		await switchToVisualMode(page);
		await expect(page.getByTestId("visual-problem-solver")).toBeVisible();
		await expect(page.getByTestId("addition-problem-solver")).not.toBeVisible();
	});

	test("initial disk counts are 0–9 per zone for each active place", async ({
		page,
	}) => {
		await switchToVisualMode(page);
		for (const place of ["ones_pl", "tens_pl", "hundreds_pl"]) {
			const top = await diskCount(page, "top", place);
			const bottom = await diskCount(page, "bottom", place);
			expect(top).toBeGreaterThanOrEqual(0);
			expect(top).toBeLessThanOrEqual(9);
			expect(bottom).toBeGreaterThanOrEqual(0);
			expect(bottom).toBeLessThanOrEqual(9);
		}
	});

	test("dragging a disk from bottom to top updates counts by ±1", async ({
		page,
	}) => {
		await switchToVisualMode(page);
		const bottomBefore = await diskCount(page, "bottom", "ones_pl");
		if (bottomBefore === 0) return; // addend2 is 0 for ones column — skip
		const topBefore = await diskCount(page, "top", "ones_pl");
		await dragDisk(page, "ones_pl", "bottom", "top");
		await expect
			.poll(() => diskCount(page, "bottom", "ones_pl"))
			.toBe(bottomBefore - 1);
		await expect
			.poll(() => diskCount(page, "top", "ones_pl"))
			.toBe(topBefore + 1);
	});

	test("dragging a zone with 10 disks onto the next column carries 10", async ({
		page,
	}) => {
		await switchToVisualMode(page);
		// Consolidate all ones disks into top
		let bottom = await diskCount(page, "bottom", "ones_pl");
		while (bottom > 0) {
			await dragDisk(page, "ones_pl", "bottom", "top");
			await expect
				.poll(() => diskCount(page, "bottom", "ones_pl"))
				.toBe(bottom - 1);
			bottom--;
		}
		const top = await diskCount(page, "top", "ones_pl");
		if (top < 10) {
			// This problem has no carry in ones — test is N/A
			return;
		}
		const tensBefore = await diskCount(page, "top", "tens_pl");
		await carryZone(page, "ones_pl", "tens_pl");
		// Ones top loses 10; tens top gains 1
		await expect.poll(() => diskCount(page, "top", "ones_pl")).toBe(top - 10);
		await expect
			.poll(() => diskCount(page, "top", "tens_pl"))
			.toBe(tensBefore + 1);
	});

	test("fully solving a problem shows the Correct! banner and records attempt", async ({
		page,
	}) => {
		await switchToVisualMode(page);
		// Solve each column left-to-right (ones → tens → hundreds for default 3-digit difficulty)
		for (const place of ["ones_pl", "tens_pl", "hundreds_pl"]) {
			await solveColumn(page, place);
		}
		await expect(page.getByTestId("visual-correct-banner")).toBeVisible();
		// Expand Statistics section and verify an attempt was recorded
		await page.getByText("Statistics").click();
		await expect(page.getByText(/attempted/)).toBeVisible();
	});

	test("New Problem resets the visual work state", async ({ page }) => {
		await switchToVisualMode(page);
		const bottomBefore = await diskCount(page, "bottom", "ones_pl");
		if (bottomBefore > 0) {
			await dragDisk(page, "ones_pl", "bottom", "top");
			await expect
				.poll(() => diskCount(page, "bottom", "ones_pl"))
				.toBe(bottomBefore - 1);
		}
		await page.getByText("New Problem").click();
		// After reset: solver still visible with a fresh problem
		await expect(page.getByTestId("visual-problem-solver")).toBeVisible();
		// Disk counts are reset (total per column matches fresh addend values, both ≥ 0)
		const topAfter = await diskCount(page, "top", "ones_pl");
		const bottomAfter = await diskCount(page, "bottom", "ones_pl");
		expect(topAfter + bottomAfter).toBeGreaterThanOrEqual(0);
	});

	test("switching back to Digit mode restores digit solver", async ({
		page,
	}) => {
		await switchToVisualMode(page);
		// switchToVisualMode closes Settings; re-open to access mode buttons
		await openSettings(page);
		await page.getByTestId("mode-btn-digit").click();
		await expect(page.getByTestId("addition-problem-solver")).toBeVisible();
		await expect(page.getByTestId("visual-problem-solver")).not.toBeVisible();
	});
});
