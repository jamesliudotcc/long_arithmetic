import { describe, expect, test } from "bun:test";
import { PLACES } from "@domain/addition";
import {
	type MultiplicationDifficulty,
	type MultiplicationProblem,
	computeMultiplicationSolution,
	enterLatticeCellDigit,
	enterLatticeDiagonalDigit,
	enterFinalAdditionCarry,
	enterFinalSumDigit,
	enterFinalSumOverflow,
	generateMultiplicationProblem,
	initialFinalSumWork,
	initialLatticeWork,
} from "@domain/multiplication";

describe("computeMultiplicationSolution - partial products", () => {
	test("3 × 4 = 12: answerDigit=2, finalCarryOut=1", () => {
		const problem: MultiplicationProblem = {
			multiplicand: { ones_pl: 3, tens_pl: 0, hundreds_pl: 0, thousands_pl: 0 },
			multiplier: 4,
			numPlaces: 1,
			multiplierPlaces: 1,
		};
		const sol = computeMultiplicationSolution(problem);
		expect(sol.partialProducts[0].columns.ones_pl.carryIn).toBe(0);
		expect(sol.partialProducts[0].columns.ones_pl.rawProduct).toBe(12);
		expect(sol.partialProducts[0].columns.ones_pl.answerDigit).toBe(2);
		expect(sol.partialProducts[0].columns.ones_pl.carryOut).toBe(1);
		expect(sol.partialProducts[0].finalCarryOut).toBe(1);
	});

	test("34 × 6 = 204: ones carry=2, tens digit=0, finalCarryOut=2", () => {
		const problem: MultiplicationProblem = {
			multiplicand: { ones_pl: 4, tens_pl: 3, hundreds_pl: 0, thousands_pl: 0 },
			multiplier: 6,
			numPlaces: 2,
			multiplierPlaces: 1,
		};
		const sol = computeMultiplicationSolution(problem);
		// ones: 4×6=24 → digit=4, carry=2
		expect(sol.partialProducts[0].columns.ones_pl.carryIn).toBe(0);
		expect(sol.partialProducts[0].columns.ones_pl.rawProduct).toBe(24);
		expect(sol.partialProducts[0].columns.ones_pl.answerDigit).toBe(4);
		expect(sol.partialProducts[0].columns.ones_pl.carryOut).toBe(2);
		// tens: 3×6+2=20 → digit=0, carry=2
		expect(sol.partialProducts[0].columns.tens_pl.carryIn).toBe(2);
		expect(sol.partialProducts[0].columns.tens_pl.rawProduct).toBe(20);
		expect(sol.partialProducts[0].columns.tens_pl.answerDigit).toBe(0);
		expect(sol.partialProducts[0].columns.tens_pl.carryOut).toBe(2);
		expect(sol.partialProducts[0].finalCarryOut).toBe(2);
	});

	test("123 × 5 = 615: verify every column", () => {
		const problem: MultiplicationProblem = {
			multiplicand: {
				ones_pl: 3,
				tens_pl: 2,
				hundreds_pl: 1,
				thousands_pl: 0,
			},
			multiplier: 5,
			numPlaces: 3,
			multiplierPlaces: 1,
		};
		const sol = computeMultiplicationSolution(problem);
		// ones: 3×5=15 → digit=5, carry=1
		expect(sol.partialProducts[0].columns.ones_pl.answerDigit).toBe(5);
		expect(sol.partialProducts[0].columns.ones_pl.carryOut).toBe(1);
		// tens: 2×5+1=11 → digit=1, carry=1
		expect(sol.partialProducts[0].columns.tens_pl.carryIn).toBe(1);
		expect(sol.partialProducts[0].columns.tens_pl.rawProduct).toBe(11);
		expect(sol.partialProducts[0].columns.tens_pl.answerDigit).toBe(1);
		expect(sol.partialProducts[0].columns.tens_pl.carryOut).toBe(1);
		// hundreds: 1×5+1=6 → digit=6, carry=0
		expect(sol.partialProducts[0].columns.hundreds_pl.carryIn).toBe(1);
		expect(sol.partialProducts[0].columns.hundreds_pl.rawProduct).toBe(6);
		expect(sol.partialProducts[0].columns.hundreds_pl.answerDigit).toBe(6);
		expect(sol.partialProducts[0].columns.hundreds_pl.carryOut).toBe(0);
		expect(sol.partialProducts[0].finalCarryOut).toBe(0);
	});

	test("111 × 1 = 111: all carryOut=0", () => {
		const problem: MultiplicationProblem = {
			multiplicand: {
				ones_pl: 1,
				tens_pl: 1,
				hundreds_pl: 1,
				thousands_pl: 0,
			},
			multiplier: 1,
			numPlaces: 3,
			multiplierPlaces: 1,
		};
		const sol = computeMultiplicationSolution(problem);
		for (const place of ["ones_pl", "tens_pl", "hundreds_pl"] as const) {
			expect(sol.partialProducts[0].columns[place].carryOut).toBe(0);
			expect(sol.partialProducts[0].columns[place].answerDigit).toBe(1);
		}
		expect(sol.partialProducts[0].finalCarryOut).toBe(0);
	});

	test("inactive places are zero-filled", () => {
		const problem: MultiplicationProblem = {
			multiplicand: { ones_pl: 7, tens_pl: 0, hundreds_pl: 0, thousands_pl: 0 },
			multiplier: 2,
			numPlaces: 1,
			multiplierPlaces: 1,
		};
		const sol = computeMultiplicationSolution(problem);
		expect(sol.partialProducts[0].columns.tens_pl.carryIn).toBe(0);
		expect(sol.partialProducts[0].columns.tens_pl.rawProduct).toBe(0);
		expect(sol.partialProducts[0].columns.tens_pl.answerDigit).toBe(0);
		expect(sol.partialProducts[0].columns.tens_pl.carryOut).toBe(0);
		expect(sol.partialProducts[0].columns.hundreds_pl.answerDigit).toBe(0);
	});

	test("multi-digit multiplier: 12 × 34 produces two partial products", () => {
		// 12 × 34: ones partial (×4, shift=0) = 48; tens partial (×3, shift=1) = 36
		const problem: MultiplicationProblem = {
			multiplicand: { ones_pl: 2, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			multiplier: 34,
			numPlaces: 2,
			multiplierPlaces: 2,
		};
		const sol = computeMultiplicationSolution(problem);
		expect(sol.partialProducts).toHaveLength(2);
		// ones row (shift=0): multiplierDigit=4
		expect(sol.partialProducts[0].multiplierDigit).toBe(4);
		expect(sol.partialProducts[0].shift).toBe(0);
		expect(sol.partialProducts[0].columns.ones_pl.answerDigit).toBe(8); // 2×4=8
		expect(sol.partialProducts[0].columns.tens_pl.answerDigit).toBe(4); // 1×4=4
		expect(sol.partialProducts[0].finalCarryOut).toBe(0);
		// tens row (shift=1): multiplierDigit=3
		expect(sol.partialProducts[1].multiplierDigit).toBe(3);
		expect(sol.partialProducts[1].shift).toBe(1);
		expect(sol.partialProducts[1].columns.ones_pl.answerDigit).toBe(6); // 2×3=6
		expect(sol.partialProducts[1].columns.tens_pl.answerDigit).toBe(3); // 1×3=3
		expect(sol.partialProducts[1].finalCarryOut).toBe(0);
	});
});

describe("computeMultiplicationSolution - digit products", () => {
	test("12 × 34 keeps each digit-by-digit product with its shift", () => {
		const problem: MultiplicationProblem = {
			multiplicand: { ones_pl: 2, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			multiplier: 34,
			numPlaces: 2,
			multiplierPlaces: 2,
		};
		const sol = computeMultiplicationSolution(problem);

		expect(sol.digitProducts).toEqual([
			{
				multiplicandPlace: "ones_pl",
				multiplicandDigit: 2,
				multiplierDigit: 4,
				multiplierShift: 0,
				shift: 0,
				product: 8,
				onesDigit: 8,
				tensDigit: 0,
			},
			{
				multiplicandPlace: "tens_pl",
				multiplicandDigit: 1,
				multiplierDigit: 4,
				multiplierShift: 0,
				shift: 1,
				product: 4,
				onesDigit: 4,
				tensDigit: 0,
			},
			{
				multiplicandPlace: "ones_pl",
				multiplicandDigit: 2,
				multiplierDigit: 3,
				multiplierShift: 1,
				shift: 1,
				product: 6,
				onesDigit: 6,
				tensDigit: 0,
			},
			{
				multiplicandPlace: "tens_pl",
				multiplicandDigit: 1,
				multiplierDigit: 3,
				multiplierShift: 1,
				shift: 2,
				product: 3,
				onesDigit: 3,
				tensDigit: 0,
			},
		]);
	});

	test("67 × 89 decomposes two-digit cell products and accumulated shifts", () => {
		const problem: MultiplicationProblem = {
			multiplicand: { ones_pl: 7, tens_pl: 6, hundreds_pl: 0, thousands_pl: 0 },
			multiplier: 89,
			numPlaces: 2,
			multiplierPlaces: 2,
		};
		const sol = computeMultiplicationSolution(problem);

		expect(sol.digitProducts).toEqual([
			expect.objectContaining({
				multiplicandPlace: "ones_pl",
				multiplierDigit: 9,
				multiplierShift: 0,
				shift: 0,
				product: 63,
				onesDigit: 3,
				tensDigit: 6,
			}),
			expect.objectContaining({
				multiplicandPlace: "tens_pl",
				multiplierDigit: 9,
				multiplierShift: 0,
				shift: 1,
				product: 54,
				onesDigit: 4,
				tensDigit: 5,
			}),
			expect.objectContaining({
				multiplicandPlace: "ones_pl",
				multiplierDigit: 8,
				multiplierShift: 1,
				shift: 1,
				product: 56,
				onesDigit: 6,
				tensDigit: 5,
			}),
			expect.objectContaining({
				multiplicandPlace: "tens_pl",
				multiplierDigit: 8,
				multiplierShift: 1,
				shift: 2,
				product: 48,
				onesDigit: 8,
				tensDigit: 4,
			}),
		]);
	});
});

describe("computeMultiplicationSolution - lattice", () => {
	test("12 × 34 exposes lattice cells in display order", () => {
		const problem: MultiplicationProblem = {
			multiplicand: { ones_pl: 2, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			multiplier: 34,
			numPlaces: 2,
			multiplierPlaces: 2,
		};
		const sol = computeMultiplicationSolution(problem);

		expect(sol.lattice.cells[0][0]).toEqual(
			expect.objectContaining({
				multiplicandDigit: 1,
				multiplierDigit: 3,
				product: 3,
				tensDigit: 0,
				onesDigit: 3,
				tensDiagonal: 3,
				onesDiagonal: 2,
			}),
		);
		expect(sol.lattice.cells[1][1]).toEqual(
			expect.objectContaining({
				multiplicandDigit: 2,
				multiplierDigit: 4,
				product: 8,
				tensDigit: 0,
				onesDigit: 8,
				tensDiagonal: 1,
				onesDiagonal: 0,
			}),
		);
	});

	test("99 × 99 lattice diagonals reconstruct 9801", () => {
		const problem: MultiplicationProblem = {
			multiplicand: { ones_pl: 9, tens_pl: 9, hundreds_pl: 0, thousands_pl: 0 },
			multiplier: 99,
			numPlaces: 2,
			multiplierPlaces: 2,
		};
		const sol = computeMultiplicationSolution(problem);

		expect(sol.lattice.diagonals.map((diagonal) => diagonal.resultDigit)).toEqual([
			1, 0, 8, 9,
		]);
		expect(sol.lattice.diagonals[1]).toEqual(
			expect.objectContaining({
				carryIn: 0,
				sum: 10,
				resultDigit: 0,
				carryOut: 1,
			}),
		);
	});
});

describe("lattice work", () => {
	const problem: MultiplicationProblem = {
		multiplicand: { ones_pl: 2, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
		multiplier: 34,
		numPlaces: 2,
		multiplierPlaces: 2,
	};
	const solution = computeMultiplicationSolution(problem);

	test("cell products accept free-order entry", () => {
		const work = initialLatticeWork(problem);
		const next = enterLatticeCellDigit(work, solution, 1, 1, "ones", "8");
		expect(next.cells[1][1].ones.status).toBe("correct");
		expect(next.solved).toBe(false);
	});

	test("diagonal digits accept free-order entry", () => {
		const work = initialLatticeWork(problem);
		const next = enterLatticeDiagonalDigit(work, solution, 2, "4");
		expect(next.diagonals[2]).toEqual({ answer: "4", status: "correct" });
		expect(next.solved).toBe(false);
	});

	test("solved becomes true once all cell halves and diagonal digits are correct", () => {
		let work = initialLatticeWork(problem);
		for (let row = 0; row < solution.lattice.cells.length; row++) {
			for (let col = 0; col < solution.lattice.cells[row].length; col++) {
				const cell = solution.lattice.cells[row][col];
				work = enterLatticeCellDigit(
					work,
					solution,
					row,
					col,
					"tens",
					String(cell.tensDigit),
				);
				work = enterLatticeCellDigit(
					work,
					solution,
					row,
					col,
					"ones",
					String(cell.onesDigit),
				);
			}
		}
		for (const diagonal of solution.lattice.diagonals) {
			work = enterLatticeDiagonalDigit(
				work,
				solution,
				diagonal.index,
				String(diagonal.resultDigit),
			);
		}
		expect(work.solved).toBe(true);
	});
});

// --- NEW FAILING TESTS ---
// These require `finalResult` on MultiplicationSolution and tighter type ranges.

describe("computeMultiplicationSolution - finalResult", () => {
	test("3 × 4 = 12: ones=2, tens=1, no overflow", () => {
		const problem: MultiplicationProblem = {
			multiplicand: { ones_pl: 3, tens_pl: 0, hundreds_pl: 0, thousands_pl: 0 },
			multiplier: 4,
			numPlaces: 1,
			multiplierPlaces: 1,
		};
		const sol = computeMultiplicationSolution(problem);
		expect(sol.finalResult.digits.ones_pl).toBe(2);
		expect(sol.finalResult.digits.tens_pl).toBe(1);
		expect(sol.finalResult.digits.hundreds_pl).toBe(0);
		expect(sol.finalResult.digits.thousands_pl).toBe(0);
		expect(sol.finalResult.overflow).toBe(0);
	});

	test("12 × 34 = 408: three-digit result, no overflow", () => {
		const problem: MultiplicationProblem = {
			multiplicand: { ones_pl: 2, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			multiplier: 34,
			numPlaces: 2,
			multiplierPlaces: 2,
		};
		const sol = computeMultiplicationSolution(problem);
		expect(sol.finalResult.digits.ones_pl).toBe(8);
		expect(sol.finalResult.digits.tens_pl).toBe(0);
		expect(sol.finalResult.digits.hundreds_pl).toBe(4);
		expect(sol.finalResult.digits.thousands_pl).toBe(0);
		expect(sol.finalResult.overflow).toBe(0);
	});

	test("99 × 99 = 9801: four-digit result, no overflow", () => {
		const problem: MultiplicationProblem = {
			multiplicand: { ones_pl: 9, tens_pl: 9, hundreds_pl: 0, thousands_pl: 0 },
			multiplier: 99,
			numPlaces: 2,
			multiplierPlaces: 2,
		};
		const sol = computeMultiplicationSolution(problem);
		expect(sol.finalResult.digits.ones_pl).toBe(1);
		expect(sol.finalResult.digits.tens_pl).toBe(0);
		expect(sol.finalResult.digits.hundreds_pl).toBe(8);
		expect(sol.finalResult.digits.thousands_pl).toBe(9);
		expect(sol.finalResult.overflow).toBe(0);
	});

	test("123 × 45 = 5535: 3×2 result fits in four places", () => {
		const problem: MultiplicationProblem = {
			multiplicand: { ones_pl: 3, tens_pl: 2, hundreds_pl: 1, thousands_pl: 0 },
			multiplier: 45,
			numPlaces: 3,
			multiplierPlaces: 2,
		};
		const sol = computeMultiplicationSolution(problem);
		expect(sol.finalResult.digits.ones_pl).toBe(5);
		expect(sol.finalResult.digits.tens_pl).toBe(3);
		expect(sol.finalResult.digits.hundreds_pl).toBe(5);
		expect(sol.finalResult.digits.thousands_pl).toBe(5);
		expect(sol.finalResult.overflow).toBe(0);
	});

	test("999 × 99 = 98901: overflow digit is 9", () => {
		const problem: MultiplicationProblem = {
			multiplicand: { ones_pl: 9, tens_pl: 9, hundreds_pl: 9, thousands_pl: 0 },
			multiplier: 99,
			numPlaces: 3,
			multiplierPlaces: 2,
		};
		const sol = computeMultiplicationSolution(problem);
		expect(sol.finalResult.digits.ones_pl).toBe(1);
		expect(sol.finalResult.digits.tens_pl).toBe(0);
		expect(sol.finalResult.digits.hundreds_pl).toBe(9);
		expect(sol.finalResult.digits.thousands_pl).toBe(8);
		expect(sol.finalResult.overflow).toBe(9);
	});

	test("finalResult equals multiplicand × multiplier for 50 random 2×2 problems", () => {
		// Numeric cross-check: digits must reconstruct to the real product
		for (let i = 0; i < 50; i++) {
			const p = generateMultiplicationProblem({
				numPlaces: 2,
				multiplierPlaces: 2,
			});
			const sol = computeMultiplicationSolution(p);
			const { digits, overflow } = sol.finalResult;
			const reconstructed =
				digits.ones_pl +
				digits.tens_pl * 10 +
				digits.hundreds_pl * 100 +
				digits.thousands_pl * 1000 +
				overflow * 10000;
			const multiplicandValue =
				p.multiplicand.ones_pl +
				p.multiplicand.tens_pl * 10 +
				p.multiplicand.hundreds_pl * 100;
			expect(reconstructed).toBe(multiplicandValue * p.multiplier);
		}
	});
});

// ── FinalSumWork domain tests ────────────────────────────────────────────────

describe("initialFinalSumWork", () => {
	test("returns entries for numPlaces places, all idle/empty, unlockedUpTo=0, solved=false", () => {
		const work = initialFinalSumWork(3);
		expect(work.unlockedUpTo).toBe(0);
		expect(work.solved).toBe(false);
		expect(work.entries.ones_pl).toEqual({ answer: "", status: "idle" });
		expect(work.entries.tens_pl).toEqual({ answer: "", status: "idle" });
		expect(work.entries.hundreds_pl).toEqual({ answer: "", status: "idle" });
	});

	test("numPlaces=1 creates only ones_pl entry", () => {
		const work = initialFinalSumWork(1);
		expect(work.entries.ones_pl).toEqual({ answer: "", status: "idle" });
		expect(work.entries.tens_pl).toBeUndefined();
	});
});

describe("enterFinalSumDigit", () => {
	// 12 × 34 = 408: ones=8, tens=0, hundreds=4
	const problem: MultiplicationProblem = {
		multiplicand: { ones_pl: 2, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
		multiplier: 34,
		numPlaces: 2,
		multiplierPlaces: 2,
	};
	const solution = computeMultiplicationSolution(problem);
	const numPlaces = 3; // displayWidth = 2 + 2 - 1 = 3

	test("entering correct ones digit marks correct and advances unlockedUpTo to 1", () => {
		const work = initialFinalSumWork(numPlaces);
		const next = enterFinalSumDigit(work, solution, "ones_pl", "8", numPlaces);
		expect(next.entries.ones_pl?.status).toBe("correct");
		expect(next.entries.ones_pl?.answer).toBe("8");
		expect(next.unlockedUpTo).toBe(1);
		expect(next.solved).toBe(false);
	});

	test("entering incorrect ones digit marks incorrect, unlockedUpTo unchanged", () => {
		const work = initialFinalSumWork(numPlaces);
		const next = enterFinalSumDigit(work, solution, "ones_pl", "5", numPlaces);
		expect(next.entries.ones_pl?.status).toBe("incorrect");
		expect(next.unlockedUpTo).toBe(0);
		expect(next.solved).toBe(false);
	});

	test("entering out-of-order (locked) place → state unchanged (same reference)", () => {
		const work = initialFinalSumWork(numPlaces);
		// tens_pl is locked (unlockedUpTo=0, placeIndex=1 > 0)
		const next = enterFinalSumDigit(work, solution, "tens_pl", "0", numPlaces);
		expect(next).toBe(work);
	});

	test("completing all places correctly → solved: true", () => {
		let work = initialFinalSumWork(numPlaces);
		work = enterFinalSumDigit(work, solution, "ones_pl", "8", numPlaces);
		work = enterFinalSumDigit(work, solution, "tens_pl", "0", numPlaces);
		work = enterFinalSumDigit(work, solution, "hundreds_pl", "4", numPlaces);
		expect(work.solved).toBe(true);
		expect(work.entries.hundreds_pl?.status).toBe("correct");
	});

	test("correct partial then incorrect next → solved stays false", () => {
		let work = initialFinalSumWork(numPlaces);
		work = enterFinalSumDigit(work, solution, "ones_pl", "8", numPlaces);
		work = enterFinalSumDigit(work, solution, "tens_pl", "9", numPlaces); // wrong
		expect(work.solved).toBe(false);
		expect(work.entries.tens_pl?.status).toBe("incorrect");
		expect(work.unlockedUpTo).toBe(1); // didn't advance
	});
});

describe("finalAdditionCarryIns", () => {
	test("12 × 34 = 408: carry-ins are {ones_pl:0, tens_pl:0, hundreds_pl:1}", () => {
		const problem: MultiplicationProblem = {
			multiplicand: { ones_pl: 2, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			multiplier: 34,
			numPlaces: 2,
			multiplierPlaces: 2,
		};
		const sol = computeMultiplicationSolution(problem);
		expect(sol.finalAdditionCarryIns.ones_pl).toBe(0);
		expect(sol.finalAdditionCarryIns.tens_pl).toBe(0);
		expect(sol.finalAdditionCarryIns.hundreds_pl).toBe(1);
	});

	test("670 × 82 = 54940: all carry-ins are zero", () => {
		const problem: MultiplicationProblem = {
			multiplicand: {
				ones_pl: 0,
				tens_pl: 7,
				hundreds_pl: 6,
				thousands_pl: 0,
			},
			multiplier: 82,
			numPlaces: 3,
			multiplierPlaces: 2,
		};
		const sol = computeMultiplicationSolution(problem);
		expect(sol.finalAdditionCarryIns.ones_pl).toBe(0);
		expect(sol.finalAdditionCarryIns.tens_pl).toBe(0);
		expect(sol.finalAdditionCarryIns.hundreds_pl).toBe(0);
		expect(sol.finalAdditionCarryIns.thousands_pl).toBe(0);
	});

	test("99 × 99 = 9801: carry-ins are {ones_pl:0, tens_pl:0, hundreds_pl:1}", () => {
		const problem: MultiplicationProblem = {
			multiplicand: { ones_pl: 9, tens_pl: 9, hundreds_pl: 0, thousands_pl: 0 },
			multiplier: 99,
			numPlaces: 2,
			multiplierPlaces: 2,
		};
		const sol = computeMultiplicationSolution(problem);
		expect(sol.finalAdditionCarryIns.ones_pl).toBe(0);
		expect(sol.finalAdditionCarryIns.tens_pl).toBe(0);
		expect(sol.finalAdditionCarryIns.hundreds_pl).toBe(1);
	});
});

describe("initialFinalSumWork - new fields", () => {
	test("has additionCarryEntries, overflowAnswer, overflowStatus", () => {
		const work = initialFinalSumWork(3);
		expect(work.additionCarryEntries).toBeDefined();
		expect(work.overflowAnswer).toBe("");
		expect(work.overflowStatus).toBe("idle");
	});

	test("additionCarryEntries has entries for numPlaces places", () => {
		const work = initialFinalSumWork(3);
		expect(work.additionCarryEntries.ones_pl).toEqual({
			answer: "",
			status: "idle",
		});
		expect(work.additionCarryEntries.tens_pl).toEqual({
			answer: "",
			status: "idle",
		});
		expect(work.additionCarryEntries.hundreds_pl).toEqual({
			answer: "",
			status: "idle",
		});
		expect(work.additionCarryEntries.thousands_pl).toBeUndefined();
	});
});

describe("enterFinalAdditionCarry", () => {
	// 12 × 34 = 408: finalAdditionCarryIns = {ones_pl:0, tens_pl:0, hundreds_pl:1}
	const problem: MultiplicationProblem = {
		multiplicand: { ones_pl: 2, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
		multiplier: 34,
		numPlaces: 2,
		multiplierPlaces: 2,
	};
	const solution = computeMultiplicationSolution(problem);
	const numPlaces = 3;

	test("correct carry marks correct; unlockedUpTo unchanged", () => {
		const work = initialFinalSumWork(numPlaces);
		const next = enterFinalAdditionCarry(
			work,
			solution,
			"hundreds_pl",
			"1",
			numPlaces,
		);
		expect(next.additionCarryEntries.hundreds_pl?.status).toBe("correct");
		expect(next.unlockedUpTo).toBe(0); // no sequential unlock
	});

	test("incorrect carry marks incorrect", () => {
		const work = initialFinalSumWork(numPlaces);
		const next = enterFinalAdditionCarry(
			work,
			solution,
			"hundreds_pl",
			"5",
			numPlaces,
		);
		expect(next.additionCarryEntries.hundreds_pl?.status).toBe("incorrect");
	});

	test("zero carry-in is always correct when entering '0'", () => {
		const work = initialFinalSumWork(numPlaces);
		const next = enterFinalAdditionCarry(
			work,
			solution,
			"ones_pl",
			"0",
			numPlaces,
		);
		expect(next.additionCarryEntries.ones_pl?.status).toBe("correct");
	});
});

describe("enterFinalSumOverflow", () => {
	// 999 × 99 = 98901: overflow=9
	const problem: MultiplicationProblem = {
		multiplicand: { ones_pl: 9, tens_pl: 9, hundreds_pl: 9, thousands_pl: 0 },
		multiplier: 99,
		numPlaces: 3,
		multiplierPlaces: 2,
	};
	const solution = computeMultiplicationSolution(problem);
	const numPlaces = 4;

	test("correct overflow digit marks overflowStatus correct", () => {
		const work = initialFinalSumWork(numPlaces);
		const next = enterFinalSumOverflow(work, solution, "9");
		expect(next.overflowAnswer).toBe("9");
		expect(next.overflowStatus).toBe("correct");
	});

	test("incorrect overflow digit marks overflowStatus incorrect", () => {
		const work = initialFinalSumWork(numPlaces);
		const next = enterFinalSumOverflow(work, solution, "5");
		expect(next.overflowStatus).toBe("incorrect");
	});
});

describe("enterFinalSumDigit - overflow gates solved", () => {
	// 999 × 99 = 98901: overflow=9, digits={ones:1,tens:0,hundreds:9,thousands:8}
	const problem: MultiplicationProblem = {
		multiplicand: { ones_pl: 9, tens_pl: 9, hundreds_pl: 9, thousands_pl: 0 },
		multiplier: 99,
		numPlaces: 3,
		multiplierPlaces: 2,
	};
	const solution = computeMultiplicationSolution(problem);
	const numPlaces = 4; // displayWidth = 3+2-1=4

	test("solved stays false after all digits correct until overflow entered", () => {
		let work = initialFinalSumWork(numPlaces);
		work = enterFinalSumDigit(work, solution, "ones_pl", "1", numPlaces);
		work = enterFinalSumDigit(work, solution, "tens_pl", "0", numPlaces);
		work = enterFinalSumDigit(work, solution, "hundreds_pl", "9", numPlaces);
		work = enterFinalSumDigit(work, solution, "thousands_pl", "8", numPlaces);
		expect(work.solved).toBe(false); // overflow not yet entered
	});

	test("solved becomes true after all digits AND overflow correct", () => {
		let work = initialFinalSumWork(numPlaces);
		work = enterFinalSumDigit(work, solution, "ones_pl", "1", numPlaces);
		work = enterFinalSumDigit(work, solution, "tens_pl", "0", numPlaces);
		work = enterFinalSumDigit(work, solution, "hundreds_pl", "9", numPlaces);
		work = enterFinalSumDigit(work, solution, "thousands_pl", "8", numPlaces);
		work = enterFinalSumOverflow(work, solution, "9");
		expect(work.solved).toBe(true);
	});
});

describe("generateMultiplicationProblem", () => {
	test("numPlaces is at most 3", () => {
		// TypeScript type is 1|2|3; verify runtime values stay in range
		for (const numPlaces of [1, 2, 3] as const) {
			const p = generateMultiplicationProblem({
				numPlaces,
				multiplierPlaces: 1,
			});
			expect(p.numPlaces).toBe(numPlaces);
		}
	});

	test("multiplierPlaces is at most 2 (using valid combinations)", () => {
		// numPlaces=2 allows multiplierPlaces up to 2
		for (const multiplierPlaces of [1, 2] as const) {
			const p = generateMultiplicationProblem({
				numPlaces: 2,
				multiplierPlaces,
			});
			expect(p.multiplierPlaces).toBe(multiplierPlaces);
		}
	});

	test("all multiplicand digit values are 0–9", () => {
		const difficulty: MultiplicationDifficulty = {
			numPlaces: 3,
			multiplierPlaces: 2,
		};
		for (let i = 0; i < 200; i++) {
			const p = generateMultiplicationProblem(difficulty);
			for (const place of PLACES) {
				expect(p.multiplicand[place]).toBeGreaterThanOrEqual(0);
				expect(p.multiplicand[place]).toBeLessThanOrEqual(9);
			}
		}
	});

	test("leading digit of multiplicand is ≥ 1 for all numPlaces", () => {
		for (const numPlaces of [1, 2, 3] as const) {
			const difficulty: MultiplicationDifficulty = {
				numPlaces,
				multiplierPlaces: 1,
			};
			for (let i = 0; i < 50; i++) {
				const p = generateMultiplicationProblem(difficulty);
				const leadingPlace = PLACES[numPlaces - 1];
				expect(p.multiplicand[leadingPlace]).toBeGreaterThanOrEqual(1);
			}
		}
	});

	test("multiplier has exactly multiplierPlaces digits for valid combinations", () => {
		// Only test combinations where multiplierPlaces ≤ numPlaces
		const validCombos: Array<[1 | 2 | 3, 1 | 2]> = [
			[1, 1],
			[2, 1],
			[2, 2],
			[3, 1],
			[3, 2],
		];
		for (const [numPlaces, multiplierPlaces] of validCombos) {
			for (let i = 0; i < 20; i++) {
				const p = generateMultiplicationProblem({
					numPlaces,
					multiplierPlaces,
				});
				const minVal = 10 ** (multiplierPlaces - 1);
				const maxVal = 10 ** multiplierPlaces - 1;
				expect(p.multiplier).toBeGreaterThanOrEqual(minVal);
				expect(p.multiplier).toBeLessThanOrEqual(maxVal);
			}
		}
	});

	test("inactive PlaceValues slots are 0", () => {
		for (const numPlaces of [1, 2] as const) {
			const difficulty: MultiplicationDifficulty = {
				numPlaces,
				multiplierPlaces: 1,
			};
			for (let i = 0; i < 50; i++) {
				const p = generateMultiplicationProblem(difficulty);
				for (let j = numPlaces; j < PLACES.length; j++) {
					expect(p.multiplicand[PLACES[j]]).toBe(0);
				}
			}
		}
	});

	// --- NEW FAILING TESTS: multiplierPlaces ≤ numPlaces constraint ---

	test("multiplierPlaces is always ≤ numPlaces in generated problem", () => {
		// All combos including ones where the difficulty asks for too many multiplier digits
		const allCombos: Array<[1 | 2 | 3, 1 | 2]> = [
			[1, 1],
			[1, 2], // invalid: should clamp to multiplierPlaces=1
			[2, 1],
			[2, 2],
			[3, 1],
			[3, 2],
		];
		for (const [numPlaces, multiplierPlaces] of allCombos) {
			for (let i = 0; i < 20; i++) {
				const p = generateMultiplicationProblem({
					numPlaces,
					multiplierPlaces,
				});
				expect(p.multiplierPlaces).toBeLessThanOrEqual(p.numPlaces);
			}
		}
	});

	test("numPlaces=1 always produces a single-digit multiplier regardless of difficulty", () => {
		// Even if difficulty requests multiplierPlaces=2, must clamp to 1
		for (let i = 0; i < 50; i++) {
			const p = generateMultiplicationProblem({
				numPlaces: 1,
				multiplierPlaces: 2,
			});
			expect(p.multiplierPlaces).toBe(1);
			expect(p.multiplier).toBeGreaterThanOrEqual(1);
			expect(p.multiplier).toBeLessThanOrEqual(9);
		}
	});
});
