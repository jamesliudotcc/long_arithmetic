import { type Page, expect, test } from "@playwright/test";

async function gotoLattice(page: Page, numDigits: number, multiplierPlaces: number) {
	await page.goto(
		`/multiplication?numDigits=${numDigits}&multiplierPlaces=${multiplierPlaces}&mode=lattice`,
	);
	await page
		.getByTestId("multiplication-lattice-solver")
		.waitFor({ state: "attached" });
}

test.describe("Multiplication lattice mode", () => {
	test("route mode=lattice renders lattice solver instead of digit solver", async ({
		page,
	}) => {
		await gotoLattice(page, 2, 2);
		await expect(page.getByTestId("multiplication-lattice-solver")).toBeVisible();
		await expect(
			page.getByTestId("multiplication-problem-solver"),
		).not.toBeAttached();
	});

	test("2×2 lattice renders all cells and diagonal result inputs", async ({
		page,
	}) => {
		await gotoLattice(page, 2, 2);

		for (const cellId of [
			"lattice-cell-r0-c0",
			"lattice-cell-r0-c1",
			"lattice-cell-r1-c0",
			"lattice-cell-r1-c1",
		]) {
			await expect(page.getByTestId(cellId)).toBeVisible();
		}

		for (const diagonalId of [
			"lattice-diagonal-0",
			"lattice-diagonal-1",
			"lattice-diagonal-2",
			"lattice-diagonal-3",
		]) {
			await expect(page.getByTestId(diagonalId)).toBeVisible();
		}
	});

	test("later diagonal and cell inputs are editable immediately", async ({
		page,
	}) => {
		await gotoLattice(page, 3, 2);

		const laterDiagonal = page.getByTestId("lattice-diagonal-3");
		await laterDiagonal.fill("7");
		await expect(laterDiagonal).toHaveValue("7");

		const laterCellHalf = page.getByTestId("lattice-cell-r1-c2-ones");
		await laterCellHalf.fill("5");
		await expect(laterCellHalf).toHaveValue("5");
	});
});
