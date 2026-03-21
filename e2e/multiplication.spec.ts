import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

// Navigate to the multiplication page with the given parameters and wait for
// the solver container to be present in the DOM.
async function gotoMultiplication(
	page: Page,
	numDigits: number,
	multiplierPlaces: number,
) {
	await page.goto(
		`/multiplication?numDigits=${numDigits}&multiplierPlaces=${multiplierPlaces}`,
	);
	await page
		.getByTestId("multiplication-problem-solver")
		.waitFor({ state: "attached" });
}

test.describe("Multiplication UI", () => {
	// ── Bug 1 & 2: carry rows and answer rows per partial product ──────────────

	test("2×1 problem shows one carry row and one answer row", async ({
		page,
	}) => {
		await gotoMultiplication(page, 2, 1);

		// carry-row-0 must exist (the single carry row for row 0)
		await expect(page.getByTestId("carry-row-0")).toBeVisible();

		// carry-row-1 must NOT exist (only one multiplier digit)
		await expect(page.getByTestId("carry-row-1")).not.toBeAttached();

		// answer-row-0 must exist
		await expect(page.getByTestId("answer-row-0")).toBeVisible();

		// answer-row-1 must NOT exist
		await expect(page.getByTestId("answer-row-1")).not.toBeAttached();
	});

	test("2×2 problem shows two carry rows and two answer rows", async ({
		page,
	}) => {
		// Bug 1: currently only one carry row is rendered for the active row.
		// Bug 2: completed rows become static (no dedicated answer-row testID).
		await gotoMultiplication(page, 2, 2);

		await expect(page.getByTestId("carry-row-0")).toBeVisible();
		await expect(page.getByTestId("carry-row-1")).toBeVisible();

		await expect(page.getByTestId("answer-row-0")).toBeVisible();
		await expect(page.getByTestId("answer-row-1")).toBeVisible();
	});

	test("inactive carry rows reserve space without showing inputs", async ({
		page,
	}) => {
		await gotoMultiplication(page, 3, 2);

		await expect(page.getByTestId("carry-row-1")).toBeVisible();
		await expect(page.getByTestId("carry-input-row1-ones_pl")).toBeVisible();
		await expect(
			page.locator('[data-testid="carry-input-row1-ones_pl"] input'),
		).not.toBeAttached();

		await expect(page.getByTestId("carry-row-0")).toBeVisible();
		await expect(
			page.locator('[data-testid="carry-input-row0-ones_pl"] input'),
		).toBeVisible();
		await expect(page.getByTestId("carry-input-row0-tens_pl")).toBeVisible();
		await expect(
			page.locator('[data-testid="carry-input-row0-tens_pl"] input'),
		).not.toBeAttached();
	});

	test("active carry row opens all scratch inputs for the row", async ({
		page,
	}) => {
		await gotoMultiplication(page, 3, 1);

		const onesCarry = page.locator('[data-testid="carry-input-row0-ones_pl"] input');
		const tensCarry = page.locator('[data-testid="carry-input-row0-tens_pl"] input');

		await page.getByTestId("answer-row-0-ones_pl").waitFor({ state: "visible" });
		await expect(onesCarry).toBeEditable();
		await expect(tensCarry).toBeVisible();
		await expect(tensCarry).toBeEditable();
		await expect(page.getByTestId("carry-empty-row0-thousands_pl")).toBeAttached();
		await expect(
			page.locator('[data-testid="carry-input-row0-hundreds_pl"] input'),
		).not.toBeAttached();
	});

	// ── Bug 2 (staircase): row 1 ones column must be empty ────────────────────

	test("2×2 answer row 1 has ones column empty (staircase shift)", async ({
		page,
	}) => {
		// The tens partial product (row 1) is shifted left by one place, so the
		// ones column of that row should be an empty placeholder, not an input.
		await gotoMultiplication(page, 2, 2);

		// ones cell of row 1 is empty (not an input)
		await expect(page.getByTestId("answer-row-1-ones_pl-empty")).toBeAttached();

		// tens cell of row 1 is a real input (the ones digit of the tens partial product)
		await expect(page.getByTestId("answer-row-1-tens_pl")).toBeVisible();
	});

	// ── Bug 3: extra blank overflow column ─────────────────────────────────────

	test("2×2 multiplicand row has exactly displayWidth non-overflow cells", async ({
		page,
	}) => {
		// displayWidth = numPlaces + multiplierPlaces - 1 = 2 + 2 - 1 = 3
		// Bug 3: an extra overflow cell is always prepended, making the row 4 wide.
		// The hundreds cell should be empty (12 has no hundreds digit) but
		// there should be no further cell beyond hundreds.
		await gotoMultiplication(page, 2, 2);

		// The ones and tens cells of the multiplicand must be present.
		await expect(page.getByTestId("multiplicand-ones_pl")).toBeVisible();
		await expect(page.getByTestId("multiplicand-tens_pl")).toBeVisible();

		// The hundreds cell should be an empty placeholder (12 has no hundreds digit).
		await expect(
			page.getByTestId("multiplicand-empty-hundreds_pl"),
		).toBeAttached();

		// There must be NO cell beyond the hundreds position (no thousands placeholder).
		// If bug 3 is present the extra overflow column means a thousands cell exists.
		await expect(
			page.getByTestId("multiplicand-empty-thousands_pl"),
		).not.toBeAttached();
	});

	// ── Issue 1: × symbol in multiplier row ──────────────────────────────────────

	test("multiplier row shows × symbol", async ({ page }) => {
		await gotoMultiplication(page, 2, 2);
		const symbol = page.getByTestId("multiplier-symbol");
		await expect(symbol).toBeVisible();
		await expect(symbol).toContainText("×");
	});

	// ── Final sum row: always visible, interactive after solving partial products ─

	test("final-sum-row is visible on a freshly loaded page (always rendered)", async ({
		page,
	}) => {
		await gotoMultiplication(page, 1, 1);
		await expect(page.getByTestId("final-sum-row")).toBeVisible();
		// Cells are locked until partial products are solved
		await expect(page.getByTestId("final-sum-ones_pl")).toBeAttached();
	});

	test("final-addition carry row keeps its space hidden until final addition starts", async ({
		page,
	}) => {
		await gotoMultiplication(page, 2, 2);

		await expect(page.getByTestId("final-addition-carry-row")).toBeVisible();
		await expect(page.getByTestId("final-addition-carry-ones_pl")).toBeVisible();
		await expect(
			page.locator('[data-testid="final-addition-carry-ones_pl"] input'),
		).not.toBeAttached();
		await expect(page.getByTestId("final-addition-carry-tens_pl")).toBeVisible();
		await expect(
			page.locator('[data-testid="final-addition-carry-tens_pl"] input'),
		).not.toBeAttached();
	});

	test("final-addition carry row opens all slots once partial products are solved", async ({
		page,
	}) => {
		await gotoMultiplication(page, 2, 2);

		async function bf(testId: string, nextTestId?: string): Promise<void> {
			const cell = page.getByTestId(testId);
			for (let d = 0; d <= 9; d++) {
				await cell.fill(String(d));
				await page.waitForTimeout(40);
				if (
					nextTestId &&
					(await page.getByTestId(nextTestId).isEditable().catch(() => false))
				)
					break;
			}
		}

		async function bfDC(testId: string, nextTestId?: string): Promise<void> {
			const cell = page.locator(`[data-testid="${testId}"] input`);
			for (let d = 0; d <= 9; d++) {
				if (!(await cell.isEditable().catch(() => false))) break;
				await cell.fill(String(d));
				await page.waitForTimeout(40);
				if (
					nextTestId &&
					(await page.getByTestId(nextTestId).isEditable().catch(() => false))
				)
					break;
			}
		}

		await bf("answer-row-0-ones_pl", "answer-row-0-tens_pl");
		if (
			!(await page.getByTestId("answer-row-0-tens_pl").isEditable().catch(() => false))
		) {
			await bfDC("carry-input-row0-ones_pl", "answer-row-0-tens_pl");
			await bf("answer-row-0-ones_pl", "answer-row-0-tens_pl");
		}
		await bf("answer-row-0-tens_pl");
		const fc0 = page.locator('[data-testid="answer-row-0-finalcarry"] input');
		if (await fc0.isEditable().catch(() => false)) {
			for (let d = 0; d <= 9; d++) {
				if (!(await fc0.isEditable().catch(() => false))) break;
				await fc0.fill(String(d));
				await page.waitForTimeout(40);
				if (
					await page.getByTestId("answer-row-1-tens_pl").isEditable().catch(() => false)
				)
					break;
			}
		}

		await bf("answer-row-1-tens_pl", "answer-row-1-hundreds_pl");
		if (
			!(await page
				.getByTestId("answer-row-1-hundreds_pl")
				.isEditable()
				.catch(() => false))
		) {
			await bfDC("carry-input-row1-ones_pl", "answer-row-1-hundreds_pl");
			await bf("answer-row-1-tens_pl", "answer-row-1-hundreds_pl");
		}
		await bf("answer-row-1-hundreds_pl");
		const fc1 = page.locator('[data-testid="answer-row-1-finalcarry"] input');
		if (await fc1.isEditable().catch(() => false)) {
			for (let d = 0; d <= 9; d++) {
				if (!(await fc1.isEditable().catch(() => false))) break;
				await fc1.fill(String(d));
				await page.waitForTimeout(40);
				if (
					await page
						.locator('[data-testid="final-addition-carry-ones_pl"] input')
						.isEditable()
						.catch(() => false)
				)
					break;
			}
		}

		await expect(
			page.locator('[data-testid="final-addition-carry-ones_pl"] input'),
		).toBeEditable();
		await expect(
			page.locator('[data-testid="final-addition-carry-tens_pl"] input'),
		).toBeEditable();
		await expect(
			page.locator('[data-testid="final-addition-carry-hundreds_pl"] input'),
		).toBeEditable();
	});

	test("solving a 1×1 problem via partial product then final sum shows success banner", async ({
		page,
	}) => {
		await gotoMultiplication(page, 1, 1);

		// DigitCell uses testID on the outer <View>, so target the inner <input>
		// for the finalCarry cell. React Native web renders editable={false} as
		// <input readonly>, so use isEditable() (not isEnabled()) for lock checks.
		const finalCarryInner = page.locator(
			'[data-testid="answer-row-0-finalcarry"] input',
		);
		const finalSumInput = page.getByTestId("final-sum-ones_pl");

		// Brute-force ones_pl; stop as soon as either finalCarry or finalSum unlocks
		const answerInput = page.getByTestId("answer-row-0-ones_pl");
		await answerInput.waitFor({ state: "visible" });
		for (let digit = 0; digit <= 9; digit++) {
			await answerInput.fill(String(digit));
			const finalSumEditable = await finalSumInput
				.isEditable()
				.catch(() => false);
			const finalCarryEditable = await finalCarryInner
				.isEditable()
				.catch(() => false);
			if (finalSumEditable || finalCarryEditable) break;
		}

		// Handle optional final carry (when partial product ≥ 10);
		// stop as soon as the finalSum input becomes editable
		if (await finalCarryInner.isEditable().catch(() => false)) {
			for (let digit = 0; digit <= 9; digit++) {
				await finalCarryInner.fill(String(digit));
				if (await finalSumInput.isEditable().catch(() => false)) break;
			}
		}

		// Brute-force the final sum ones_pl input until the success banner appears
		for (let digit = 0; digit <= 9; digit++) {
			await finalSumInput.fill(String(digit));
			if (
				await page
					.getByTestId("success-banner")
					.isVisible()
					.catch(() => false)
			)
				break;
		}

		await expect(page.getByTestId("success-banner")).toBeVisible();
	});

	test("solving a 2×2 problem shows success banner (brute-force)", async ({
		page,
	}) => {
		await gotoMultiplication(page, 2, 2);

		// Brute-force an input cell (located by testID on the <input> itself)
		// until the success banner is visible or the provided nextTestId becomes editable.
		async function bf(testId: string, nextTestId?: string): Promise<void> {
			const cell = page.getByTestId(testId);
			for (let d = 0; d <= 9; d++) {
				await cell.fill(String(d));
				await page.waitForTimeout(40);
				if (
					await page
						.getByTestId("success-banner")
						.isVisible()
						.catch(() => false)
				)
					return;
				if (
					nextTestId &&
					(await page
						.getByTestId(nextTestId)
						.isEditable()
						.catch(() => false))
				)
					break;
			}
		}

		// Brute-force a DigitCell input (testID on outer View, need inner <input>)
		// DigitCell becomes readonly once correct, so break when cell is no longer editable.
		async function bfDC(testId: string, nextTestId?: string): Promise<void> {
			const cell = page.locator(`[data-testid="${testId}"] input`);
			for (let d = 0; d <= 9; d++) {
				if (!(await cell.isEditable().catch(() => false))) break;
				await cell.fill(String(d));
				await page.waitForTimeout(40);
				if (
					await page
						.getByTestId("success-banner")
						.isVisible()
						.catch(() => false)
				)
					return;
				// Break if cell became correct (no longer editable)
				if (!(await cell.isEditable().catch(() => false))) break;
				if (!nextTestId) break;
				if (
					await page
						.getByTestId(nextTestId)
						.isEditable()
						.catch(() => false)
				)
					break;
			}
		}

		// ── Row 0 (ones multiplier digit) ──────────────────────────────────────
		// Ones answer → carry-row ones carry → tens answer → explicit finalCarry
		await page
			.getByTestId("answer-row-0-ones_pl")
			.waitFor({ state: "visible" });
		// Try ones answer; if carry is needed first, carry cell won't be there yet
		// so we brute-force carry-row0 ones carry first when tens is still locked.
		await bf("answer-row-0-ones_pl", "answer-row-0-tens_pl");
		// If tens is still locked, we need to fill the ones carry
		if (
			!(await page
				.getByTestId("answer-row-0-tens_pl")
				.isEditable()
				.catch(() => false))
		) {
			await bfDC("carry-input-row0-ones_pl", "answer-row-0-tens_pl");
			await bf("answer-row-0-ones_pl", "answer-row-0-tens_pl");
		}
		await bf("answer-row-0-tens_pl");
		const fc0 = page.locator('[data-testid="answer-row-0-finalcarry"] input');
		if (await fc0.isEditable().catch(() => false)) {
			for (let d = 0; d <= 9; d++) {
				if (!(await fc0.isEditable().catch(() => false))) break;
				await fc0.fill(String(d));
				await page.waitForTimeout(40);
				if (
					await page
						.getByTestId("answer-row-1-tens_pl")
						.isEditable()
						.catch(() => false)
				)
					break;
			}
		}

		// ── Row 1 (tens multiplier digit, shift=1) ─────────────────────────────
		// Tens answer (is ones of multiplicand shifted) → carry → hundreds answer → finalCarry in overflow
		await page
			.getByTestId("answer-row-1-tens_pl")
			.waitFor({ state: "visible" });
		await bf("answer-row-1-tens_pl", "answer-row-1-hundreds_pl");
		if (
			!(await page
				.getByTestId("answer-row-1-hundreds_pl")
				.isEditable()
				.catch(() => false))
		) {
			await bfDC("carry-input-row1-ones_pl", "answer-row-1-hundreds_pl");
			await bf("answer-row-1-tens_pl", "answer-row-1-hundreds_pl");
		}
		await bf("answer-row-1-hundreds_pl", "final-sum-ones_pl");
		// finalCarry for row 1 is in the overflow slot (overflowFinalCarry=true for shift=1 in 2×2)
		const fc1 = page.locator('[data-testid="answer-row-1-finalcarry"] input');
		if (await fc1.isEditable().catch(() => false)) {
			for (let d = 0; d <= 9; d++) {
				if (!(await fc1.isEditable().catch(() => false))) break;
				await fc1.fill(String(d));
				await page.waitForTimeout(40);
				if (!(await fc1.isEditable().catch(() => false))) break;
				if (
					await page
						.getByTestId("final-sum-ones_pl")
						.isEditable()
						.catch(() => false)
				)
					break;
			}
		}

		// ── Final-addition carry row (independent DigitCell inputs) ───────────
		for (const place of ["ones_pl", "tens_pl", "hundreds_pl"]) {
			const carryInner = page.locator(
				`[data-testid="final-addition-carry-${place}"] input`,
			);
			if (!(await carryInner.isVisible().catch(() => false))) continue;
			for (let d = 0; d <= 9; d++) {
				if (!(await carryInner.isEditable().catch(() => false))) break;
				await carryInner.fill(String(d));
				await page.waitForTimeout(40);
				if (!(await carryInner.isEditable().catch(() => false))) break;
				if (
					await page
						.getByTestId("final-sum-ones_pl")
						.isEditable()
						.catch(() => false)
				)
					break;
			}
		}

		// ── Final sum row (ones → tens → hundreds) ────────────────────────────
		await page.getByTestId("final-sum-ones_pl").waitFor({ state: "visible" });
		await bf("final-sum-ones_pl", "final-sum-tens_pl");
		await bf("final-sum-tens_pl", "final-sum-hundreds_pl");
		await bf("final-sum-hundreds_pl");

		await expect(page.getByTestId("success-banner")).toBeVisible();
	});
});
