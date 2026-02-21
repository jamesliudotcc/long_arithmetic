import { describe, expect, it } from "bun:test";
import { PLACES, toNumber } from "./addition";
import {
	type SubtractionProblem,
	computeSubtractionSolution,
	generateSubtractionProblem,
} from "./subtraction";

describe("computeSubtractionSolution", () => {
	it("1-digit no borrow: 5−3=2 → answerDigit=2, borrowOut=0", () => {
		const p: SubtractionProblem = {
			minuend: { ones_pl: 5, tens_pl: 0, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 3, tens_pl: 0, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 1,
		};
		const sol = computeSubtractionSolution(p);
		expect(sol.columns.ones_pl.borrowIn).toBe(0);
		expect(sol.columns.ones_pl.effectiveTop).toBe(5);
		expect(sol.columns.ones_pl.borrowOut).toBe(0);
		expect(sol.columns.ones_pl.answerDigit).toBe(2);
	});

	it("inactive places remain zero-filled (numPlaces=1)", () => {
		const p: SubtractionProblem = {
			minuend: { ones_pl: 7, tens_pl: 0, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 2, tens_pl: 0, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 1,
		};
		const sol = computeSubtractionSolution(p);
		for (const place of ["tens_pl", "hundreds_pl", "thousands_pl"] as const) {
			expect(sol.columns[place]).toEqual({
				borrowIn: 0,
				borrowOut: 0,
				effectiveTop: 0,
				answerDigit: 0,
			});
		}
	});

	it("2-digit single borrow: 32−19=13", () => {
		const p: SubtractionProblem = {
			minuend: { ones_pl: 2, tens_pl: 3, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 9, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		};
		const sol = computeSubtractionSolution(p);
		// ones: effectiveTop=2, 2<9 → borrowOut=1, answerDigit=2+10-9=3
		expect(sol.columns.ones_pl.borrowOut).toBe(1);
		expect(sol.columns.ones_pl.answerDigit).toBe(3);
		// tens: borrowIn=1, effectiveTop=3-1=2, 2>=1 → borrowOut=0, answerDigit=1
		expect(sol.columns.tens_pl.borrowIn).toBe(1);
		expect(sol.columns.tens_pl.effectiveTop).toBe(2);
		expect(sol.columns.tens_pl.borrowOut).toBe(0);
		expect(sol.columns.tens_pl.answerDigit).toBe(1);
	});

	it("3-digit borrow chain: 500−278=222", () => {
		const p: SubtractionProblem = {
			minuend: { ones_pl: 0, tens_pl: 0, hundreds_pl: 5, thousands_pl: 0 },
			subtrahend: { ones_pl: 8, tens_pl: 7, hundreds_pl: 2, thousands_pl: 0 },
			numPlaces: 3,
		};
		const sol = computeSubtractionSolution(p);
		// ones: effectiveTop=0, 0<8 → borrowOut=1, answerDigit=0+10-8=2
		expect(sol.columns.ones_pl.borrowOut).toBe(1);
		expect(sol.columns.ones_pl.answerDigit).toBe(2);
		// tens: borrowIn=1, effectiveTop=0-1=-1, -1<7 → borrowOut=1, answerDigit=-1+10-7=2
		expect(sol.columns.tens_pl.borrowIn).toBe(1);
		expect(sol.columns.tens_pl.effectiveTop).toBe(-1);
		expect(sol.columns.tens_pl.borrowOut).toBe(1);
		expect(sol.columns.tens_pl.answerDigit).toBe(2);
		// hundreds: borrowIn=1, effectiveTop=5-1=4, 4>=2 → borrowOut=0, answerDigit=2
		expect(sol.columns.hundreds_pl.borrowIn).toBe(1);
		expect(sol.columns.hundreds_pl.effectiveTop).toBe(4);
		expect(sol.columns.hundreds_pl.borrowOut).toBe(0);
		expect(sol.columns.hundreds_pl.answerDigit).toBe(2);
	});

	it("4-digit borrow chain: 9001−1002=7999", () => {
		const p: SubtractionProblem = {
			minuend: {
				ones_pl: 1,
				tens_pl: 0,
				hundreds_pl: 0,
				thousands_pl: 9,
			},
			subtrahend: {
				ones_pl: 2,
				tens_pl: 0,
				hundreds_pl: 0,
				thousands_pl: 1,
			},
			numPlaces: 4,
		};
		const sol = computeSubtractionSolution(p);
		// ones: 1<2 → borrowOut=1, answerDigit=1+10-2=9
		expect(sol.columns.ones_pl.borrowOut).toBe(1);
		expect(sol.columns.ones_pl.answerDigit).toBe(9);
		// tens: borrowIn=1, effectiveTop=-1, -1<0 → borrowOut=1, answerDigit=9
		expect(sol.columns.tens_pl.borrowOut).toBe(1);
		expect(sol.columns.tens_pl.answerDigit).toBe(9);
		// hundreds: borrowIn=1, effectiveTop=-1, -1<0 → borrowOut=1, answerDigit=9
		expect(sol.columns.hundreds_pl.borrowOut).toBe(1);
		expect(sol.columns.hundreds_pl.answerDigit).toBe(9);
		// thousands: borrowIn=1, effectiveTop=8, 8>=1 → borrowOut=0, answerDigit=7
		expect(sol.columns.thousands_pl.borrowIn).toBe(1);
		expect(sol.columns.thousands_pl.borrowOut).toBe(0);
		expect(sol.columns.thousands_pl.answerDigit).toBe(7);
	});
});

describe("generateSubtractionProblem", () => {
	it("throws when numBorrows >= numPlaces", () => {
		expect(() =>
			generateSubtractionProblem({ numPlaces: 2, numBorrows: 2 }),
		).toThrow();
		expect(() =>
			generateSubtractionProblem({ numPlaces: 1, numBorrows: 1 }),
		).toThrow();
		expect(() =>
			generateSubtractionProblem({ numPlaces: 3, numBorrows: 3 }),
		).toThrow();
	});

	it("returns the requested numPlaces", () => {
		const seeded = () => 0.5;
		const problem = generateSubtractionProblem(
			{ numPlaces: 3, numBorrows: 2 },
			seeded,
		);
		expect(problem.numPlaces).toBe(3);
	});

	it("all digit values are 0–9 (200 iterations, numPlaces=4, numBorrows=2)", () => {
		for (let iter = 0; iter < 200; iter++) {
			const p = generateSubtractionProblem({ numPlaces: 4, numBorrows: 2 });
			for (const place of PLACES) {
				expect(p.minuend[place]).toBeGreaterThanOrEqual(0);
				expect(p.minuend[place]).toBeLessThanOrEqual(9);
				expect(p.subtrahend[place]).toBeGreaterThanOrEqual(0);
				expect(p.subtrahend[place]).toBeLessThanOrEqual(9);
			}
		}
	});

	it("leading digits ≥ 1 for both minuend and subtrahend (all numPlaces, 50 iter each)", () => {
		for (const numPlaces of [1, 2, 3, 4] as const) {
			const leadingPlace = PLACES[numPlaces - 1];
			for (let iter = 0; iter < 50; iter++) {
				const p = generateSubtractionProblem({ numPlaces, numBorrows: 0 });
				expect(p.minuend[leadingPlace]).toBeGreaterThanOrEqual(1);
				expect(p.subtrahend[leadingPlace]).toBeGreaterThanOrEqual(1);
			}
		}
	});

	it("inactive places are always 0 (numPlaces=2, 50 iterations)", () => {
		for (let iter = 0; iter < 50; iter++) {
			const p = generateSubtractionProblem({ numPlaces: 2, numBorrows: 0 });
			expect(p.minuend.hundreds_pl).toBe(0);
			expect(p.minuend.thousands_pl).toBe(0);
			expect(p.subtrahend.hundreds_pl).toBe(0);
			expect(p.subtrahend.thousands_pl).toBe(0);
		}
	});

	it("numBorrows=0: no column borrows (borrowOut=0 for all active columns, 200 iterations)", () => {
		for (let iter = 0; iter < 200; iter++) {
			const p = generateSubtractionProblem({ numPlaces: 4, numBorrows: 0 });
			const sol = computeSubtractionSolution(p);
			for (let i = 0; i < 4; i++) {
				const place = PLACES[i];
				expect(sol.columns[place].borrowOut).toBe(0);
			}
		}
	});

	it("numBorrows=k: at most k columns borrow, borrows are consecutive from ones (200 iter, k=1,2,3)", () => {
		for (const numBorrows of [1, 2, 3] as const) {
			for (let iter = 0; iter < 200; iter++) {
				const p: SubtractionProblem = generateSubtractionProblem({
					numPlaces: 4,
					numBorrows,
				});
				const sol = computeSubtractionSolution(p);
				let actualBorrows = 0;
				for (let i = 0; i < 4; i++) {
					if (sol.columns[PLACES[i]].borrowOut === 1) actualBorrows++;
				}
				expect(actualBorrows).toBeLessThanOrEqual(numBorrows);
				// Borrows must be consecutive from the ones place
				let seenNoBorrow = false;
				for (let i = 0; i < 4; i++) {
					const borrows = sol.columns[PLACES[i]].borrowOut === 1;
					if (seenNoBorrow) expect(borrows).toBe(false);
					if (!borrows) seenNoBorrow = true;
				}
			}
		}
	});

	it("leading column never borrows out (200 iterations each numPlaces)", () => {
		for (const numPlaces of [1, 2, 3, 4] as const) {
			for (let iter = 0; iter < 200; iter++) {
				const p = generateSubtractionProblem({
					numPlaces,
					numBorrows: (numPlaces - 1) as 0 | 1 | 2 | 3,
				});
				const sol = computeSubtractionSolution(p);
				expect(sol.columns[PLACES[numPlaces - 1]].borrowOut).toBe(0);
			}
		}
	});

	it("correctness: toNumber(minuend) − toNumber(subtrahend) = answer value (200 iterations, multiple difficulties)", () => {
		const cases = [
			{ numPlaces: 1, numBorrows: 0 },
			{ numPlaces: 2, numBorrows: 1 },
			{ numPlaces: 3, numBorrows: 2 },
			{ numPlaces: 4, numBorrows: 3 },
			{ numPlaces: 4, numBorrows: 1 },
		] as const;
		for (const difficulty of cases) {
			for (let iter = 0; iter < 200; iter++) {
				const p = generateSubtractionProblem(difficulty);
				const sol = computeSubtractionSolution(p);
				const answerValue = PLACES.slice(0, p.numPlaces).reduce(
					(sum, place, i) => sum + sol.columns[place].answerDigit * 10 ** i,
					0,
				);
				expect(answerValue).toBe(toNumber(p.minuend) - toNumber(p.subtrahend));
			}
		}
	});

	it("effectiveTop >= 0 for all active columns (200 iterations, numPlaces=4, numBorrows=3)", () => {
		for (let iter = 0; iter < 200; iter++) {
			const p = generateSubtractionProblem({ numPlaces: 4, numBorrows: 3 });
			const sol = computeSubtractionSolution(p);
			for (let i = 0; i < p.numPlaces; i++) {
				const place = PLACES[i];
				expect(sol.columns[place].effectiveTop).toBeGreaterThanOrEqual(0);
			}
		}
	});

	it("result is always non-negative (200 iterations, numPlaces=4, numBorrows=3)", () => {
		for (let iter = 0; iter < 200; iter++) {
			const p = generateSubtractionProblem({ numPlaces: 4, numBorrows: 3 });
			expect(toNumber(p.minuend)).toBeGreaterThanOrEqual(
				toNumber(p.subtrahend),
			);
		}
	});
});
