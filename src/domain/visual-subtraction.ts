import { PLACES, type Place } from "./addition";
import type { SubtractionProblem } from "./subtraction";

export type VisualSubColumnState = {
	readonly borrow: number; // 0–10 — ones-discs received from borrowing
	readonly minuend: number; // working top zone
	readonly subtrahend: number; // discs to cancel
};

export type VisualSubWorkState = {
	readonly columns: Record<Place, VisualSubColumnState>;
	readonly activeColumn: number;
	readonly solved: boolean;
};

export function isSubColumnDone(col: VisualSubColumnState): boolean {
	return col.subtrahend === 0 && col.borrow === 0;
}

export function canBorrowFrom(col: VisualSubColumnState): boolean {
	return col.minuend > 0;
}

// If the active column's minuend is 0 but borrow > 0, automatically move all
// borrow discs down so the student doesn't have to click each one individually.
function autoDrainBorrow(work: VisualSubWorkState): VisualSubWorkState {
	const activePlace = PLACES[work.activeColumn];
	if (!activePlace) return work;
	const col = work.columns[activePlace];
	if (col.minuend !== 0 || col.borrow <= 0) return work;
	const newCol: VisualSubColumnState = {
		...col,
		minuend: col.borrow,
		borrow: 0,
	};
	return { ...work, columns: { ...work.columns, [activePlace]: newCol } };
}

function advanceSubIfDone(
	work: VisualSubWorkState,
	numPlaces: number,
): VisualSubWorkState {
	let { activeColumn, solved } = work;
	while (
		activeColumn < numPlaces &&
		isSubColumnDone(work.columns[PLACES[activeColumn]])
	) {
		activeColumn += 1;
	}
	if (activeColumn >= numPlaces) {
		solved = true;
	}
	if (activeColumn === work.activeColumn && solved === work.solved) {
		return work;
	}
	return { ...work, activeColumn, solved };
}

export function initialVisualSubWork(
	problem: SubtractionProblem,
): VisualSubWorkState {
	const { minuend, subtrahend } = problem;
	const columns: Record<Place, VisualSubColumnState> = {
		ones_pl: {
			borrow: 0,
			minuend: minuend.ones_pl,
			subtrahend: subtrahend.ones_pl,
		},
		tens_pl: {
			borrow: 0,
			minuend: minuend.tens_pl,
			subtrahend: subtrahend.tens_pl,
		},
		hundreds_pl: {
			borrow: 0,
			minuend: minuend.hundreds_pl,
			subtrahend: subtrahend.hundreds_pl,
		},
		thousands_pl: {
			borrow: 0,
			minuend: minuend.thousands_pl,
			subtrahend: subtrahend.thousands_pl,
		},
	};
	const base: VisualSubWorkState = {
		columns,
		activeColumn: 0,
		solved: false,
	};
	return advanceSubIfDone(base, problem.numPlaces);
}

export function applySubCancel(
	work: VisualSubWorkState,
	place: Place,
	numPlaces: number,
): VisualSubWorkState {
	const index = PLACES.indexOf(place);
	if (index !== work.activeColumn) return work;
	const col = work.columns[place];
	if (col.minuend <= 0 || col.subtrahend <= 0) return work;

	const newCol: VisualSubColumnState = {
		...col,
		minuend: col.minuend - 1,
		subtrahend: col.subtrahend - 1,
	};
	const newWork: VisualSubWorkState = {
		...work,
		columns: { ...work.columns, [place]: newCol },
	};
	return advanceSubIfDone(autoDrainBorrow(newWork), numPlaces);
}

export function applySubMoveBorrowDown(
	work: VisualSubWorkState,
	place: Place,
	numPlaces: number,
): VisualSubWorkState {
	const index = PLACES.indexOf(place);
	if (index !== work.activeColumn) return work;
	const col = work.columns[place];
	if (col.borrow <= 0) return work;

	const newCol: VisualSubColumnState = {
		...col,
		borrow: col.borrow - 1,
		minuend: col.minuend + 1,
	};
	const newWork: VisualSubWorkState = {
		...work,
		columns: { ...work.columns, [place]: newCol },
	};
	return advanceSubIfDone(newWork, numPlaces);
}

export function applySubBorrowFrom(
	work: VisualSubWorkState,
	fromPlace: Place,
	numPlaces: number,
): VisualSubWorkState {
	const fromIndex = PLACES.indexOf(fromPlace);
	// Guard: fromPlace must be exactly one higher than the active column
	if (fromIndex !== work.activeColumn + 1) return work;
	const fromCol = work.columns[fromPlace];
	if (fromCol.minuend <= 0) return work;

	const activePlace = PLACES[work.activeColumn];
	const activeCol = work.columns[activePlace];

	const newFromCol: VisualSubColumnState = {
		...fromCol,
		minuend: fromCol.minuend - 1,
	};
	const newActiveCol: VisualSubColumnState = {
		...activeCol,
		borrow: activeCol.borrow + 10,
	};
	const newWork: VisualSubWorkState = {
		...work,
		columns: {
			...work.columns,
			[fromPlace]: newFromCol,
			[activePlace]: newActiveCol,
		},
	};
	return advanceSubIfDone(autoDrainBorrow(newWork), numPlaces);
}
