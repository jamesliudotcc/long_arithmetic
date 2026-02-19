import { describe, expect, it } from "bun:test";
import {
	type AdditionProblem,
	PLACES,
	decompose,
	generateAdditionProblem,
	toNumber,
} from "./addition";

describe("decompose", () => {
	it("breaks 342 into correct place values", () => {
		expect(decompose(342)).toEqual({
			ones_pl: 2,
			tens_pl: 4,
			hundreds_pl: 3,
			thousands_pl: 0,
		});
	});

	it("handles 0", () => {
		expect(decompose(0)).toEqual({
			ones_pl: 0,
			tens_pl: 0,
			hundreds_pl: 0,
			thousands_pl: 0,
		});
	});

	it("handles 9999", () => {
		expect(decompose(9999)).toEqual({
			ones_pl: 9,
			tens_pl: 9,
			hundreds_pl: 9,
			thousands_pl: 9,
		});
	});

	it("handles zeros in the middle (1001)", () => {
		expect(decompose(1001)).toEqual({
			ones_pl: 1,
			tens_pl: 0,
			hundreds_pl: 0,
			thousands_pl: 1,
		});
	});
});

describe("toNumber", () => {
	it("round-trips for several values", () => {
		for (const n of [1, 99, 342, 1001, 9999]) {
			expect(toNumber(decompose(n))).toBe(n);
		}
	});
});

describe("generateAdditionProblem", () => {
	it("throws if numCarries > numPlaces", () => {
		expect(() =>
			generateAdditionProblem({ numPlaces: 2, numCarries: 3 }),
		).toThrow();
	});

	it("returns the requested numPlaces", () => {
		const seeded = () => 0.5;
		const problem = generateAdditionProblem(
			{ numPlaces: 3, numCarries: 2 },
			seeded,
		);
		expect(problem.numPlaces).toBe(3);
	});

	it("all digit values are 0–9 (200 iterations, numPlaces=4, numCarries=2)", () => {
		for (let iter = 0; iter < 200; iter++) {
			const p = generateAdditionProblem({ numPlaces: 4, numCarries: 2 });
			for (const place of PLACES) {
				expect(p.addend1[place]).toBeGreaterThanOrEqual(0);
				expect(p.addend1[place]).toBeLessThanOrEqual(9);
				expect(p.addend2[place]).toBeGreaterThanOrEqual(0);
				expect(p.addend2[place]).toBeLessThanOrEqual(9);
			}
		}
	});

	it("leading digits ≥ 1 for both addends (all numPlaces variants, 50 iter each)", () => {
		for (const numPlaces of [1, 2, 3, 4] as const) {
			const leadingPlace = PLACES[numPlaces - 1];
			for (let iter = 0; iter < 50; iter++) {
				const p = generateAdditionProblem({ numPlaces, numCarries: 0 });
				expect(p.addend1[leadingPlace]).toBeGreaterThanOrEqual(1);
				expect(p.addend2[leadingPlace]).toBeGreaterThanOrEqual(1);
			}
		}
	});

	it("numCarries=0: ALL active column raw sums ≤ 9 (200 iterations)", () => {
		for (let iter = 0; iter < 200; iter++) {
			const p = generateAdditionProblem({ numPlaces: 4, numCarries: 0 });
			for (let i = 0; i < 4; i++) {
				const place = PLACES[i];
				expect(p.addend1[place] + p.addend2[place]).toBeLessThanOrEqual(9);
			}
		}
	});

	it("numCarries=k: first k columns raw sum ≥ 10, remaining ≤ 9 (200 iter, k=1,2,3)", () => {
		for (const numCarries of [1, 2, 3] as const) {
			for (let iter = 0; iter < 200; iter++) {
				const p: AdditionProblem = generateAdditionProblem({
					numPlaces: 4,
					numCarries,
				});
				for (let i = 0; i < 4; i++) {
					const place = PLACES[i];
					const rawSum = p.addend1[place] + p.addend2[place];
					if (i < numCarries) {
						expect(rawSum).toBeGreaterThanOrEqual(10);
					} else {
						expect(rawSum).toBeLessThanOrEqual(9);
					}
				}
			}
		}
	});

	it("inactive places are always 0 (numPlaces=2, 50 iterations)", () => {
		for (let iter = 0; iter < 50; iter++) {
			const p = generateAdditionProblem({ numPlaces: 2, numCarries: 0 });
			// hundreds_pl and thousands_pl should be 0
			expect(p.addend1.hundreds_pl).toBe(0);
			expect(p.addend1.thousands_pl).toBe(0);
			expect(p.addend2.hundreds_pl).toBe(0);
			expect(p.addend2.thousands_pl).toBe(0);
		}
	});
});
