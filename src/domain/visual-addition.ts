import { type AdditionProblem, PLACES, type Place } from "./addition";

export type VisualZone = "top" | "bottom";

export type VisualColumnState = {
	readonly top: number;
	readonly bottom: number;
};

export type VisualWorkState = {
	readonly columns: Record<Place, VisualColumnState>;
	readonly overflow: number;
	readonly activeColumn: number;
	readonly solved: boolean;
};

export function isColumnDone(col: VisualColumnState): boolean {
	const total = col.top + col.bottom;
	return total < 10 && (col.top === 0 || col.bottom === 0);
}

export function canCarry(col: VisualColumnState, zone: VisualZone): boolean {
	return col[zone] >= 10;
}

function advanceIfDone(
	work: VisualWorkState,
	numPlaces: number,
): VisualWorkState {
	let { activeColumn, solved } = work;
	while (
		activeColumn < numPlaces &&
		isColumnDone(work.columns[PLACES[activeColumn]])
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

export function initialVisualWork(problem: AdditionProblem): VisualWorkState {
	const { addend1, addend2 } = problem;
	const columns: Record<Place, VisualColumnState> = {
		ones_pl: { top: addend1.ones_pl, bottom: addend2.ones_pl },
		tens_pl: { top: addend1.tens_pl, bottom: addend2.tens_pl },
		hundreds_pl: { top: addend1.hundreds_pl, bottom: addend2.hundreds_pl },
		thousands_pl: {
			top: addend1.thousands_pl,
			bottom: addend2.thousands_pl,
		},
	};
	const base: VisualWorkState = {
		columns,
		overflow: 0,
		activeColumn: 0,
		solved: false,
	};
	return advanceIfDone(base, problem.numPlaces);
}

export function applyMoveDisk(
	work: VisualWorkState,
	place: Place,
	from: VisualZone,
	numPlaces: number,
): VisualWorkState {
	const index = PLACES.indexOf(place);
	if (index !== work.activeColumn) return work;
	const col = work.columns[place];
	if (col[from] <= 0) return work;

	const other: VisualZone = from === "top" ? "bottom" : "top";
	const newCol: VisualColumnState = {
		...col,
		[from]: col[from] - 1,
		[other]: col[other] + 1,
	};
	const newWork: VisualWorkState = {
		...work,
		columns: { ...work.columns, [place]: newCol },
	};
	return advanceIfDone(newWork, numPlaces);
}

export function applyCarryOut(
	work: VisualWorkState,
	place: Place,
	zone: VisualZone,
	numPlaces: number,
): VisualWorkState {
	const index = PLACES.indexOf(place);
	if (index !== work.activeColumn) return work;
	const col = work.columns[place];
	if (!canCarry(col, zone)) return work;

	const newCol: VisualColumnState = {
		...col,
		[zone]: col[zone] - 10,
	};

	let newColumns = { ...work.columns, [place]: newCol };
	let overflow = work.overflow;

	if (index === numPlaces - 1) {
		overflow += 1;
	} else {
		const nextPlace = PLACES[index + 1];
		newColumns = {
			...newColumns,
			[nextPlace]: {
				...newColumns[nextPlace],
				top: newColumns[nextPlace].top + 1,
			},
		};
	}

	const newWork: VisualWorkState = {
		...work,
		columns: newColumns,
		overflow,
	};
	return advanceIfDone(newWork, numPlaces);
}
