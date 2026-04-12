import { describe, expect, it } from "bun:test";
import {
	applySubBorrowFrom,
	applySubCancel,
	applySubMoveBorrowDown,
	canBorrowFrom,
	canCancelSub,
	initialVisualSubWork,
	isSubColumnDone,
} from "./visual-subtraction";

describe("isSubColumnDone", () => {
	it("{borrow:0, minuend:5, subtrahend:0} → true", () => {
		expect(isSubColumnDone({ borrow: 0, minuend: 5, subtrahend: 0 })).toBe(
			true,
		);
	});

	it("{borrow:0, minuend:0, subtrahend:0} → true", () => {
		expect(isSubColumnDone({ borrow: 0, minuend: 0, subtrahend: 0 })).toBe(
			true,
		);
	});

	it("{borrow:0, minuend:3, subtrahend:2} → false (subtrahend > 0)", () => {
		expect(isSubColumnDone({ borrow: 0, minuend: 3, subtrahend: 2 })).toBe(
			false,
		);
	});

	it("{borrow:10, minuend:3, subtrahend:0} → false (borrow > 0)", () => {
		expect(isSubColumnDone({ borrow: 10, minuend: 3, subtrahend: 0 })).toBe(
			false,
		);
	});

	it("{borrow:1, minuend:3, subtrahend:2} → false (both non-zero)", () => {
		expect(isSubColumnDone({ borrow: 1, minuend: 3, subtrahend: 2 })).toBe(
			false,
		);
	});
});

describe("canBorrowFrom", () => {
	it("minuend > 0 → true", () => {
		expect(canBorrowFrom({ borrow: 0, minuend: 5, subtrahend: 3 })).toBe(true);
		expect(canBorrowFrom({ borrow: 0, minuend: 1, subtrahend: 0 })).toBe(true);
	});

	it("minuend = 0 → false", () => {
		expect(canBorrowFrom({ borrow: 0, minuend: 0, subtrahend: 3 })).toBe(false);
	});
});

describe("canCancelSub", () => {
	it("allows cancellation whenever the visible top row covers the subtrahend", () => {
		expect(canCancelSub({ borrow: 0, minuend: 5, subtrahend: 3 })).toBe(true);
		expect(canCancelSub({ borrow: 0, minuend: 3, subtrahend: 3 })).toBe(true);
		expect(canCancelSub({ borrow: 6, minuend: 7, subtrahend: 7 })).toBe(true);
		expect(canCancelSub({ borrow: 5, minuend: 8, subtrahend: 7 })).toBe(true);
	});

	it("blocks cancellation when the visible top row still does not cover the subtrahend", () => {
		expect(canCancelSub({ borrow: 0, minuend: 3, subtrahend: 7 })).toBe(false);
		expect(canCancelSub({ borrow: 10, minuend: 3, subtrahend: 7 })).toBe(false);
		expect(canCancelSub({ borrow: 1, minuend: 0, subtrahend: 1 })).toBe(false);
	});
});

describe("initialVisualSubWork", () => {
	it("seeds minuend and subtrahend from problem", () => {
		const work = initialVisualSubWork({
			minuend: { ones_pl: 5, tens_pl: 3, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 2, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		expect(work.columns.ones_pl).toEqual({
			borrow: 0,
			minuend: 5,
			subtrahend: 2,
		});
		expect(work.columns.tens_pl).toEqual({
			borrow: 0,
			minuend: 3,
			subtrahend: 1,
		});
	});

	it("borrow starts at 0 for all columns", () => {
		const work = initialVisualSubWork({
			minuend: { ones_pl: 7, tens_pl: 4, hundreds_pl: 2, thousands_pl: 1 },
			subtrahend: { ones_pl: 3, tens_pl: 2, hundreds_pl: 1, thousands_pl: 0 },
			numPlaces: 4,
		});
		for (const col of Object.values(work.columns)) {
			expect(col.borrow).toBe(0);
		}
	});

	it("activeColumn=0 and solved=false for non-trivial problem", () => {
		const work = initialVisualSubWork({
			minuend: { ones_pl: 5, tens_pl: 3, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 2, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		expect(work.activeColumn).toBe(0);
		expect(work.solved).toBe(false);
	});

	it("auto-skips columns where subtrahend=0", () => {
		// ones_pl subtrahend=0 → done immediately → skip to tens
		const work = initialVisualSubWork({
			minuend: { ones_pl: 5, tens_pl: 3, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 0, tens_pl: 2, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		expect(work.activeColumn).toBe(1);
	});

	it("solved=true immediately when all columns have subtrahend=0", () => {
		const work = initialVisualSubWork({
			minuend: { ones_pl: 5, tens_pl: 0, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 0, tens_pl: 0, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 1,
		});
		expect(work.solved).toBe(true);
	});
});

describe("applySubCancel", () => {
	it("guard: wrong column → no-op (same reference)", () => {
		const work = initialVisualSubWork({
			minuend: { ones_pl: 5, tens_pl: 3, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 2, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		// activeColumn=0 (ones_pl); try tens_pl → no-op
		const next = applySubCancel(work, "tens_pl", 2);
		expect(next).toBe(work);
	});

	it("guard: minuend=0 → no-op", () => {
		const work = initialVisualSubWork({
			minuend: { ones_pl: 0, tens_pl: 3, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 2, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		// ones has minuend=0
		const next = applySubCancel(work, "ones_pl", 2);
		expect(next).toBe(work);
	});

	it("guard: borrow required before cancellation → no-op", () => {
		const work = initialVisualSubWork({
			minuend: { ones_pl: 3, tens_pl: 5, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 7, tens_pl: 2, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		const next = applySubCancel(work, "ones_pl", 2);
		expect(next).toBe(work);
	});

	it("allows cancellation once enough borrow discs have been moved down", () => {
		const work = initialVisualSubWork({
			minuend: { ones_pl: 3, tens_pl: 5, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 7, tens_pl: 2, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		let withBorrow = applySubBorrowFrom(work, "tens_pl", 2);
		for (let i = 0; i < 4; i++) {
			withBorrow = applySubMoveBorrowDown(withBorrow, "ones_pl", 2);
		}
		const next = applySubCancel(withBorrow, "ones_pl", 2);
		expect(next.columns.ones_pl.minuend).toBe(6);
		expect(next.columns.ones_pl.subtrahend).toBe(6);
		expect(next.columns.ones_pl.borrow).toBe(6);
	});

	it("guard: subtrahend=0 → no-op", () => {
		const work = initialVisualSubWork({
			minuend: { ones_pl: 5, tens_pl: 3, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 0, tens_pl: 2, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		// ones subtrahend=0 → auto-skipped, activeColumn=1 (tens)
		// try ones_pl (index=0, activeColumn=1) → guard fires
		const next = applySubCancel(work, "ones_pl", 2);
		expect(next).toBe(work);
	});

	it("cancel pair: minuend-=1, subtrahend-=1", () => {
		const work = initialVisualSubWork({
			minuend: { ones_pl: 5, tens_pl: 3, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 3, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		const next = applySubCancel(work, "ones_pl", 2);
		expect(next.columns.ones_pl.minuend).toBe(4);
		expect(next.columns.ones_pl.subtrahend).toBe(2);
	});

	it("auto-advances when column becomes done", () => {
		// ones: minuend=3, subtrahend=1 → cancel once → subtrahend=0, borrow=0 → done → advance
		const work = initialVisualSubWork({
			minuend: { ones_pl: 3, tens_pl: 2, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 1, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		const next = applySubCancel(work, "ones_pl", 2);
		expect(next.columns.ones_pl.subtrahend).toBe(0);
		expect(next.activeColumn).toBe(1);
	});

	it("drops remaining borrow discs after cancellation is complete", () => {
		const work = initialVisualSubWork({
			minuend: { ones_pl: 3, tens_pl: 5, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 7, tens_pl: 2, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});

		let w = applySubBorrowFrom(work, "tens_pl", 2);
		for (let i = 0; i < 5; i++) {
			w = applySubMoveBorrowDown(w, "ones_pl", 2);
		}

		for (let i = 0; i < 7; i++) {
			w = applySubCancel(w, "ones_pl", 2);
		}

		expect(w.columns.ones_pl.subtrahend).toBe(0);
		expect(w.columns.ones_pl.borrow).toBe(0);
		expect(w.columns.ones_pl.minuend).toBe(6);
		expect(w.activeColumn).toBe(1);
	});

	it("sets solved=true when last column done", () => {
		// 1-digit: ones minuend=3, subtrahend=1
		const work = initialVisualSubWork({
			minuend: { ones_pl: 3, tens_pl: 0, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 1, tens_pl: 0, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 1,
		});
		const next = applySubCancel(work, "ones_pl", 1);
		expect(next.solved).toBe(true);
	});
});

describe("applySubMoveBorrowDown", () => {
	it("guard: wrong column → no-op", () => {
		const work = initialVisualSubWork({
			minuend: { ones_pl: 3, tens_pl: 5, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 7, tens_pl: 2, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		// Set up borrow on ones by borrowing from tens
		const withBorrow = applySubBorrowFrom(work, "tens_pl", 2);
		// activeColumn=0 (ones); try to move borrow on tens_pl → guard fires
		const next = applySubMoveBorrowDown(withBorrow, "tens_pl", 2);
		expect(next).toBe(withBorrow);
	});

	it("guard: borrow=0 → no-op", () => {
		const work = initialVisualSubWork({
			minuend: { ones_pl: 5, tens_pl: 3, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 2, tens_pl: 1, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		// ones has borrow=0
		const next = applySubMoveBorrowDown(work, "ones_pl", 2);
		expect(next).toBe(work);
	});

	it("moves one disc: borrow-=1, minuend+=1", () => {
		const work = initialVisualSubWork({
			minuend: { ones_pl: 3, tens_pl: 5, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 7, tens_pl: 2, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		const withBorrow = applySubBorrowFrom(work, "tens_pl", 2);
		// ones: borrow=10, minuend=3
		const next = applySubMoveBorrowDown(withBorrow, "ones_pl", 2);
		expect(next.columns.ones_pl.borrow).toBe(9);
		expect(next.columns.ones_pl.minuend).toBe(4);
	});

	it("column not done until borrow=0 AND subtrahend=0", () => {
		const work = initialVisualSubWork({
			minuend: { ones_pl: 3, tens_pl: 5, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 7, tens_pl: 2, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		let w = applySubBorrowFrom(work, "tens_pl", 2);
		// Move all 10 borrow discs to minuend
		for (let i = 0; i < 10; i++) {
			w = applySubMoveBorrowDown(w, "ones_pl", 2);
		}
		// ones: borrow=0, minuend=13, subtrahend=7 — not done yet
		expect(w.columns.ones_pl.borrow).toBe(0);
		expect(w.columns.ones_pl.minuend).toBe(13);
		expect(w.activeColumn).toBe(0);
	});
});

describe("applySubBorrowFrom", () => {
	it("guard: fromPlace not activeColumn+1 → no-op", () => {
		const work = initialVisualSubWork({
			minuend: { ones_pl: 3, tens_pl: 5, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 7, tens_pl: 2, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		// activeColumn=0, try to borrow from ones_pl (index=0, not 1) → guard
		const next = applySubBorrowFrom(work, "ones_pl", 2);
		expect(next).toBe(work);
	});

	it("guard: fromPlace minuend=0 → no-op", () => {
		const work = initialVisualSubWork({
			minuend: { ones_pl: 3, tens_pl: 0, hundreds_pl: 5, thousands_pl: 0 },
			subtrahend: { ones_pl: 7, tens_pl: 0, hundreds_pl: 2, thousands_pl: 0 },
			numPlaces: 3,
		});
		// activeColumn=0 (ones_pl), tens_pl minuend=0 → guard
		const next = applySubBorrowFrom(work, "tens_pl", 3);
		expect(next).toBe(work);
	});

	it("transfer: fromPlace.minuend-=1, activeCol.borrow+=10", () => {
		const work = initialVisualSubWork({
			minuend: { ones_pl: 3, tens_pl: 5, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 7, tens_pl: 2, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		const next = applySubBorrowFrom(work, "tens_pl", 2);
		expect(next.columns.tens_pl.minuend).toBe(4);
		expect(next.columns.ones_pl.borrow).toBe(10);
		// activeColumn still 0 (ones not done)
		expect(next.activeColumn).toBe(0);
	});

	it("does not advance after borrow (subtrahend > 0 means column not done)", () => {
		const work = initialVisualSubWork({
			minuend: { ones_pl: 3, tens_pl: 5, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 7, tens_pl: 2, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		const next = applySubBorrowFrom(work, "tens_pl", 2);
		expect(next.activeColumn).toBe(0);
		expect(next.solved).toBe(false);
	});

	it("auto-drains borrow to minuend when active column minuend is 0", () => {
		// ones: minuend=0, subtrahend=5 → borrow from tens → borrow=10+0=10, minuend=0
		// auto-drain fires: borrow=0, minuend=10
		const work = initialVisualSubWork({
			minuend: { ones_pl: 0, tens_pl: 5, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 5, tens_pl: 2, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});
		const next = applySubBorrowFrom(work, "tens_pl", 2);
		expect(next.columns.ones_pl.borrow).toBe(0);
		expect(next.columns.ones_pl.minuend).toBe(10);
		expect(next.columns.tens_pl.minuend).toBe(4);
		// subtrahend still 5 → column not done
		expect(next.activeColumn).toBe(0);
	});

	it("full scenario: borrow → move borrow down → cancel → advance", () => {
		// ones: minuend=3, subtrahend=7. tens: minuend=5, subtrahend=2
		const work = initialVisualSubWork({
			minuend: { ones_pl: 3, tens_pl: 5, hundreds_pl: 0, thousands_pl: 0 },
			subtrahend: { ones_pl: 7, tens_pl: 2, hundreds_pl: 0, thousands_pl: 0 },
			numPlaces: 2,
		});

		// Step 1: borrow from tens
		let w = applySubBorrowFrom(work, "tens_pl", 2);
		expect(w.columns.tens_pl.minuend).toBe(4);
		expect(w.columns.ones_pl.borrow).toBe(10);

		// Step 2: move all 10 borrow discs to minuend
		for (let i = 0; i < 10; i++) {
			w = applySubMoveBorrowDown(w, "ones_pl", 2);
		}
		expect(w.columns.ones_pl.borrow).toBe(0);
		expect(w.columns.ones_pl.minuend).toBe(13);

		// Step 3: cancel 7 pairs
		for (let i = 0; i < 7; i++) {
			w = applySubCancel(w, "ones_pl", 2);
		}
		expect(w.columns.ones_pl.subtrahend).toBe(0);
		expect(w.columns.ones_pl.minuend).toBe(6);
		// Column done → advance to tens
		expect(w.activeColumn).toBe(1);
		expect(w.solved).toBe(false);

		// Step 4: cancel tens pairs
		for (let i = 0; i < 2; i++) {
			w = applySubCancel(w, "tens_pl", 2);
		}
		expect(w.columns.tens_pl.subtrahend).toBe(0);
		expect(w.solved).toBe(true);
	});
});
