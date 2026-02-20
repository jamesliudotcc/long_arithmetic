import { describe, expect, it } from "bun:test";
import type { AdditionProblem } from "./addition";
import {
	applyCarryOut,
	applyMoveDisk,
	canCarry,
	initialVisualWork,
	isColumnDone,
} from "./visual-addition";

describe("isColumnDone", () => {
	it("{top:0, bottom:0} → true", () => {
		expect(isColumnDone({ top: 0, bottom: 0 })).toBe(true);
	});

	it("{top:5, bottom:0} → true (one zone, count < 10)", () => {
		expect(isColumnDone({ top: 5, bottom: 0 })).toBe(true);
	});

	it("{top:3, bottom:4} → false (split across zones)", () => {
		expect(isColumnDone({ top: 3, bottom: 4 })).toBe(false);
	});

	it("{top:10, bottom:0} → false (count = 10, carry needed)", () => {
		expect(isColumnDone({ top: 10, bottom: 0 })).toBe(false);
	});
});

describe("canCarry", () => {
	it("zone has ≥ 10 → true", () => {
		expect(canCarry({ top: 10, bottom: 0 }, "top")).toBe(true);
		expect(canCarry({ top: 0, bottom: 12 }, "bottom")).toBe(true);
	});

	it("zone has 9 → false", () => {
		expect(canCarry({ top: 9, bottom: 0 }, "top")).toBe(false);
		expect(canCarry({ top: 0, bottom: 9 }, "bottom")).toBe(false);
	});
});

describe("initialVisualWork", () => {
	it("sets top/bottom from addend1/addend2", () => {
		const work = initialVisualWork({
			addend1: { ones_pl: 3, tens_pl: 4, hundreds_pl: 0, thousands_pl: 0 },
			addend2: { ones_pl: 5, tens_pl: 2, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		expect(work.columns.ones_pl).toEqual({ top: 3, bottom: 5 });
		expect(work.columns.tens_pl).toEqual({ top: 4, bottom: 2 });
	});

	it("overflow=0, solved=false for non-trivial problem", () => {
		const work = initialVisualWork({
			addend1: { ones_pl: 3, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			addend2: { ones_pl: 5, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		expect(work.overflow).toBe(0);
		expect(work.solved).toBe(false);
	});

	it("auto-skips columns where both addends are 0", () => {
		// numPlaces=2 but ones_pl has addends: both 0 means ones col done immediately
		const work = initialVisualWork({
			addend1: { ones_pl: 0, tens_pl: 3, hundreds_pl: 0, thousands_pl: 0 },
			addend2: { ones_pl: 0, tens_pl: 4, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		// ones_pl: {top:0, bottom:0} is done → skip to tens_pl (activeColumn=1)
		expect(work.activeColumn).toBe(1);
	});

	it("solved=true immediately when numPlaces=1 and both addends are 0", () => {
		const work = initialVisualWork({
			addend1: { ones_pl: 0, tens_pl: 0, hundreds_pl: 0, thousands_pl: 0 },
			addend2: { ones_pl: 0, tens_pl: 0, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 1,
		});
		expect(work.solved).toBe(true);
	});
});

describe("applyMoveDisk", () => {
	const baseProblem: AdditionProblem = {
		addend1: { ones_pl: 3, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
		addend2: { ones_pl: 5, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
		numPlaces: 2,
	};

	it("moves 1 disk from top to bottom", () => {
		const work = initialVisualWork(baseProblem);
		// ones_pl: top=3, bottom=5, activeColumn=0
		const next = applyMoveDisk(work, "ones_pl", "top", 2);
		expect(next.columns.ones_pl.top).toBe(2);
		expect(next.columns.ones_pl.bottom).toBe(6);
	});

	it("moves 1 disk from bottom to top", () => {
		const work = initialVisualWork(baseProblem);
		const next = applyMoveDisk(work, "ones_pl", "bottom", 2);
		expect(next.columns.ones_pl.top).toBe(4);
		expect(next.columns.ones_pl.bottom).toBe(4);
	});

	it("guard: from zone must be > 0 (no-op if 0)", () => {
		// tens_pl top=1, bottom=1 but activeColumn=0, so ones must be active
		// create a scenario where top zone of ones_pl is 0
		const work = initialVisualWork({
			addend1: { ones_pl: 0, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			addend2: { ones_pl: 5, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		// ones_pl top=0, bottom=5; try to move from top (0 disks) → no-op
		const next = applyMoveDisk(work, "ones_pl", "top", 2);
		expect(next.columns.ones_pl).toEqual({ top: 0, bottom: 5 });
	});

	it("guard: only active column (no-op for wrong place)", () => {
		const work = initialVisualWork(baseProblem);
		// activeColumn=0 (ones_pl); try to move from tens_pl → no-op
		const next = applyMoveDisk(work, "tens_pl", "top", 2);
		expect(next.columns.tens_pl).toEqual({ top: 1, bottom: 1 });
		expect(next.columns.ones_pl).toEqual({ top: 3, bottom: 5 });
	});

	it("auto-advances when move causes column done", () => {
		// ones: top=1, bottom=0 → already done? No: isColumnDone({top:1, bottom:0}) = true
		// so we need a state where ones has top=1, bottom=1 → move bottom to top → {top:2,bottom:0} done
		const work = initialVisualWork({
			addend1: { ones_pl: 1, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			addend2: { ones_pl: 1, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		// ones: top=1, bottom=1, activeColumn=0
		const next = applyMoveDisk(work, "ones_pl", "bottom", 2);
		// now ones: top=2, bottom=0 → isColumnDone({top:2, bottom:0}) = true → advance to tens
		expect(next.columns.ones_pl).toEqual({ top: 2, bottom: 0 });
		expect(next.activeColumn).toBe(1);
	});

	it("sets solved when last column done", () => {
		// 1-digit: ones_pl top=1, bottom=1
		const work = initialVisualWork({
			addend1: { ones_pl: 1, tens_pl: 0, hundreds_pl: 0, thousands_pl: 0 },
			addend2: { ones_pl: 1, tens_pl: 0, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 1,
		});
		// ones: top=1, bottom=1, activeColumn=0
		const next = applyMoveDisk(work, "ones_pl", "bottom", 1);
		// ones: top=2, bottom=0 → done → activeColumn=1 >= numPlaces=1 → solved=true
		expect(next.solved).toBe(true);
	});
});

describe("applyCarryOut", () => {
	it("subtracts 10 from zone, adds 1 to next column top", () => {
		// ones: top=12, bottom=0
		const work = initialVisualWork({
			addend1: { ones_pl: 9, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			addend2: { ones_pl: 3, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		// Manually merge disks via applyMoveDisk calls: ones top=9+3=12? No, initial is top=9, bottom=3
		// Move bottom disks to top manually using a custom state
		// Instead: start with initial work and force top to 12 by moving some disks
		// Easier: test carry on a state where top zone ≥ 10

		// ones_pl: top=9, bottom=3 → move 3 bottom disks to top to get top=12, bottom=0
		let w = work;
		w = applyMoveDisk(w, "ones_pl", "bottom", 2);
		w = applyMoveDisk(w, "ones_pl", "bottom", 2);
		w = applyMoveDisk(w, "ones_pl", "bottom", 2);
		// now ones: top=12, bottom=0 → can carry top
		expect(w.columns.ones_pl.top).toBe(12);

		const tensBefore = w.columns.tens_pl.top; // =1
		const next = applyCarryOut(w, "ones_pl", "top", 2);
		expect(next.columns.ones_pl.top).toBe(2);
		expect(next.columns.tens_pl.top).toBe(tensBefore + 1);
	});

	it("leading column carry goes to overflow", () => {
		// 1-digit problem: ones_pl top=12, bottom=0 (leading column)
		// Use applyMoveDisk to set up the state
		const work = initialVisualWork({
			addend1: { ones_pl: 9, tens_pl: 0, hundreds_pl: 0, thousands_pl: 0 },
			addend2: { ones_pl: 3, tens_pl: 0, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 1,
		});
		// ones: top=9, bottom=3 → move bottom to top
		let w = work;
		w = applyMoveDisk(w, "ones_pl", "bottom", 1);
		w = applyMoveDisk(w, "ones_pl", "bottom", 1);
		w = applyMoveDisk(w, "ones_pl", "bottom", 1);
		expect(w.columns.ones_pl.top).toBe(12);
		expect(w.overflow).toBe(0);

		const next = applyCarryOut(w, "ones_pl", "top", 1);
		expect(next.columns.ones_pl.top).toBe(2);
		expect(next.overflow).toBe(1);
	});

	it("guard: zone must have ≥ 10", () => {
		const work = initialVisualWork({
			addend1: { ones_pl: 3, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			addend2: { ones_pl: 5, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		// ones: top=3, bottom=5 → can't carry top (only 3)
		const next = applyCarryOut(work, "ones_pl", "top", 2);
		expect(next).toBe(work); // no-op, same reference
	});

	it("guard: only active column", () => {
		const work = initialVisualWork({
			addend1: { ones_pl: 3, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			addend2: { ones_pl: 5, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		// activeColumn=0 (ones_pl), try to carry tens_pl → no-op
		const next = applyCarryOut(work, "tens_pl", "top", 2);
		expect(next).toBe(work);
	});

	it("auto-advances when carry causes column done", () => {
		// After carry: ones top=2, bottom=0 → done → advance to tens
		const work = initialVisualWork({
			addend1: { ones_pl: 9, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			addend2: { ones_pl: 3, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		let w = work;
		w = applyMoveDisk(w, "ones_pl", "bottom", 2);
		w = applyMoveDisk(w, "ones_pl", "bottom", 2);
		w = applyMoveDisk(w, "ones_pl", "bottom", 2);
		// ones: top=12, bottom=0
		const next = applyCarryOut(w, "ones_pl", "top", 2);
		// ones: top=2, bottom=0 → done → activeColumn=1
		expect(next.activeColumn).toBe(1);
	});

	it("full 2-column scenario: 7+5 ones → carry → tens gets +1", () => {
		// ones: top=7, bottom=5
		const work = initialVisualWork({
			addend1: { ones_pl: 7, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			addend2: { ones_pl: 5, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		// Move all bottom (5) to top → ones: top=12, bottom=0
		let w = work;
		for (let i = 0; i < 5; i++) {
			w = applyMoveDisk(w, "ones_pl", "bottom", 2);
		}
		expect(w.columns.ones_pl).toEqual({ top: 12, bottom: 0 });

		// Carry
		w = applyCarryOut(w, "ones_pl", "top", 2);
		// ones: top=2, bottom=0 → done → advance to tens
		expect(w.columns.ones_pl).toEqual({ top: 2, bottom: 0 });
		expect(w.columns.tens_pl.top).toBe(2); // original 1 + carry 1
		expect(w.activeColumn).toBe(1);
	});
});
