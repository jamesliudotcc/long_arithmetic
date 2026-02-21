import { PLACES, type Place, type PlaceValues } from "@domain/addition";

export type SubtractionProblem = {
	minuend: PlaceValues;
	subtrahend: PlaceValues;
	numPlaces: 1 | 2 | 3 | 4;
};

export type SubtractionDifficulty = {
	numPlaces: 1 | 2 | 3 | 4;
	numBorrows: 0 | 1 | 2 | 3;
};

export type SubtractionColumnSolution = {
	borrowIn: number; // 0 or 1 — borrow received from column i-1
	borrowOut: number; // 0 or 1 — this column borrows from column i+1
	effectiveTop: number; // minuend[i] - borrowIn
	answerDigit: number; // effectiveTop + 10*borrowOut - subtrahend[i]
};

export type SubtractionSolution = {
	columns: Record<Place, SubtractionColumnSolution>;
};

function randInt(min: number, max: number, random: () => number): number {
	return Math.floor(random() * (max - min + 1)) + min;
}

export function computeSubtractionSolution(
	problem: SubtractionProblem,
): SubtractionSolution {
	const zeroCol: SubtractionColumnSolution = {
		borrowIn: 0,
		borrowOut: 0,
		effectiveTop: 0,
		answerDigit: 0,
	};
	const columns: Record<Place, SubtractionColumnSolution> = {
		ones_pl: { ...zeroCol },
		tens_pl: { ...zeroCol },
		hundreds_pl: { ...zeroCol },
		thousands_pl: { ...zeroCol },
	};
	let borrow = 0;
	for (let i = 0; i < problem.numPlaces; i++) {
		const place = PLACES[i];
		const borrowIn = borrow;
		const effectiveTop = problem.minuend[place] - borrowIn;
		let borrowOut: number;
		let answerDigit: number;
		if (effectiveTop >= problem.subtrahend[place]) {
			borrowOut = 0;
			answerDigit = effectiveTop - problem.subtrahend[place];
		} else {
			borrowOut = 1;
			answerDigit = effectiveTop + 10 - problem.subtrahend[place];
		}
		columns[place] = { borrowIn, borrowOut, effectiveTop, answerDigit };
		borrow = borrowOut;
	}
	return { columns };
}

export function generateSubtractionProblem(
	difficulty: SubtractionDifficulty,
	random: () => number = Math.random,
): SubtractionProblem {
	const { numPlaces, numBorrows } = difficulty;
	if (numBorrows >= numPlaces) {
		throw new Error(
			`numBorrows (${numBorrows}) must be less than numPlaces (${numPlaces})`,
		);
	}

	const actualBorrows = randInt(0, numBorrows, random);

	const minuend: PlaceValues = {
		ones_pl: 0,
		tens_pl: 0,
		hundreds_pl: 0,
		thousands_pl: 0,
	};
	const subtrahend: PlaceValues = {
		ones_pl: 0,
		tens_pl: 0,
		hundreds_pl: 0,
		thousands_pl: 0,
	};

	for (let i = 0; i < numPlaces; i++) {
		const place = PLACES[i];
		const isLeading = i === numPlaces - 1;
		const forceBorrow = i < actualBorrows;
		// Column i receives borrow from column i-1 iff column i-1 borrows out,
		// which happens iff i-1 < actualBorrows (i.e. i-1 was a forced-borrow column).
		const expectedBorrowIn = i > 0 && i - 1 < actualBorrows ? 1 : 0;

		if (forceBorrow) {
			// Need subtrahend[i] > effectiveTop = minuend[i] - expectedBorrowIn.
			// Lower bound is expectedBorrowIn so effectiveTop ≥ 0.
			// Upper bound is 8+expectedBorrowIn so effectiveTop ≤ 8,
			// keeping the range [effectiveTop+1, 9] non-empty.
			const m = randInt(expectedBorrowIn, 8 + expectedBorrowIn, random);
			const effectiveTop = m - expectedBorrowIn;
			const s = randInt(effectiveTop + 1, 9, random);
			minuend[place] = m;
			subtrahend[place] = s;
		} else if (isLeading) {
			// Leading column: both digits ≥ 1, no borrow out.
			// minuend ≥ 1+expectedBorrowIn ensures effectiveTop ≥ 1.
			const m = randInt(1 + expectedBorrowIn, 9, random);
			const effectiveTop = m - expectedBorrowIn;
			const s = randInt(1, effectiveTop, random);
			minuend[place] = m;
			subtrahend[place] = s;
		} else {
			// Non-force non-leading: effectiveTop ≥ 0, no borrow out.
			const m = randInt(expectedBorrowIn, 9, random);
			const effectiveTop = m - expectedBorrowIn;
			const s = randInt(0, effectiveTop, random);
			minuend[place] = m;
			subtrahend[place] = s;
		}
	}

	return { minuend, subtrahend, numPlaces };
}
