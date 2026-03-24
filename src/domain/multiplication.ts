import {
	PLACES,
	decompose,
	toNumber,
	type Place,
	type PlaceValues,
} from "@domain/addition";

export type FinalSumEntry = {
	answer: string; // "" | "0"–"9"
	status: "idle" | "correct" | "incorrect";
};

export type LatticeCellSolution = {
	row: number;
	col: number;
	multiplicandPlace: Place;
	multiplicandDigit: number;
	multiplierDigit: number;
	multiplierShift: number;
	product: number;
	tensDigit: number;
	onesDigit: number;
	tensDiagonal: number;
	onesDiagonal: number;
};

export type LatticeDiagonalSolution = {
	index: number;
	contributions: number[];
	carryIn: number;
	sum: number;
	resultDigit: number;
	carryOut: number;
};

export type LatticeWorkEntry = {
	answer: string;
	status: "idle" | "correct" | "incorrect";
};

export type LatticeCellWork = {
	tens: LatticeWorkEntry;
	ones: LatticeWorkEntry;
};

export type LatticeWorkState = {
	cells: LatticeCellWork[][];
	diagonals: LatticeWorkEntry[];
	solved: boolean;
};

export type LatticeSolution = {
	cells: LatticeCellSolution[][];
	diagonals: LatticeDiagonalSolution[];
};

export type FinalSumWork = {
	entries: Partial<Record<Place, FinalSumEntry>>;
	additionCarryEntries: Partial<Record<Place, FinalSumEntry>>;
	overflowAnswer: string;
	overflowStatus: "idle" | "correct" | "incorrect";
	unlockedUpTo: number; // place index (0=ones, 1=tens, ...)
	solved: boolean;
};

export function initialFinalSumWork(numPlaces: number): FinalSumWork {
	const entries: Partial<Record<Place, FinalSumEntry>> = {};
	const additionCarryEntries: Partial<Record<Place, FinalSumEntry>> = {};
	for (let i = 0; i < numPlaces; i++) {
		entries[PLACES[i]] = { answer: "", status: "idle" };
		additionCarryEntries[PLACES[i]] = { answer: "", status: "idle" };
	}
	return {
		entries,
		additionCarryEntries,
		overflowAnswer: "",
		overflowStatus: "idle",
		unlockedUpTo: 0,
		solved: false,
	};
}

export function enterFinalAdditionCarry(
	work: FinalSumWork,
	solution: MultiplicationSolution,
	place: Place,
	digit: string,
	_numPlaces: number,
): FinalSumWork {
	const expected = solution.finalAdditionCarryIns[place] ?? 0;
	const correct = digit === String(expected);
	const status = correct ? "correct" : "incorrect";
	return {
		...work,
		additionCarryEntries: {
			...work.additionCarryEntries,
			[place]: { answer: digit, status },
		},
	};
}

export function enterFinalSumOverflow(
	work: FinalSumWork,
	solution: MultiplicationSolution,
	digit: string,
): FinalSumWork {
	const correct = digit === String(solution.finalResult.overflow);
	const overflowStatus = correct ? "correct" : "incorrect";
	const allEntriesCorrect = Object.values(work.entries).every(
		(e) => e?.status === "correct",
	);
	const solved = allEntriesCorrect && correct;
	return { ...work, overflowAnswer: digit, overflowStatus, solved };
}

export function enterFinalSumDigit(
	work: FinalSumWork,
	solution: MultiplicationSolution,
	place: Place,
	digit: string,
	numPlaces: number,
): FinalSumWork {
	const placeIndex = PLACES.indexOf(place);
	if (placeIndex > work.unlockedUpTo) return work;

	const correct = digit === String(solution.finalResult.digits[place]);
	const status = correct ? "correct" : "incorrect";
	const newEntries = { ...work.entries, [place]: { answer: digit, status } };

	if (!correct) {
		return { ...work, entries: newEntries };
	}

	const nextUnlocked = placeIndex + 1;
	const allDigitsSolved = nextUnlocked >= numPlaces;
	const hasOverflow = solution.finalResult.overflow !== 0;
	const solved =
		allDigitsSolved && (!hasOverflow || work.overflowStatus === "correct");
	return { ...work, entries: newEntries, unlockedUpTo: nextUnlocked, solved };
}

export type MultiplicationProblem = {
	multiplicand: PlaceValues;
	multiplier: number; // multi-digit, e.g. 45
	numPlaces: 1 | 2 | 3; // digits in the multiplicand
	multiplierPlaces: 1 | 2; // digits in the multiplier
};

export type MultiplicationDifficulty = {
	numPlaces: 1 | 2 | 3;
	multiplierPlaces: 1 | 2;
};

export type MultiplicationColumnSolution = {
	carryIn: number; // accumulated carry into this column (can be 0–8)
	rawProduct: number; // digit × multiplierDigit + carryIn
	answerDigit: number; // rawProduct % 10
	carryOut: number; // Math.floor(rawProduct / 10) — can be 0–8
};

export type PartialProductRow = {
	multiplierDigit: number;
	shift: number; // 0 = ones digit of multiplier, 1 = tens digit, etc.
	columns: Record<Place, MultiplicationColumnSolution>;
	finalCarryOut: number;
};

export type DigitProduct = {
	multiplicandPlace: Place;
	multiplicandDigit: number;
	multiplierDigit: number;
	multiplierShift: number;
	shift: number;
	product: number;
	onesDigit: number;
	tensDigit: number;
};

export type FinalResultRow = {
	digits: Record<Place, number>; // ones_pl through thousands_pl
	overflow: number; // 5th digit (ten-thousands); 0 in most cases
};

export type MultiplicationSolution = {
	partialProducts: PartialProductRow[];
	digitProducts: DigitProduct[];
	finalResult: FinalResultRow;
	finalAdditionCarryIns: Partial<Record<Place, number>>;
	lattice: LatticeSolution;
};

function emptyLatticeEntry(): LatticeWorkEntry {
	return { answer: "", status: "idle" };
}

function computeLatticeSolved(work: LatticeWorkState): boolean {
	return (
		work.cells.every((row) =>
			row.every(
				(cell) =>
					cell.tens.status === "correct" && cell.ones.status === "correct",
			),
		) && work.diagonals.every((entry) => entry.status === "correct")
	);
}

export function initialLatticeWork(problem: MultiplicationProblem): LatticeWorkState {
	return {
		cells: Array.from({ length: problem.multiplierPlaces }, () =>
			Array.from({ length: problem.numPlaces }, () => ({
				tens: emptyLatticeEntry(),
				ones: emptyLatticeEntry(),
			})),
		),
		diagonals: Array.from(
			{ length: problem.numPlaces + problem.multiplierPlaces },
			() => emptyLatticeEntry(),
		),
		solved: false,
	};
}

export function enterLatticeCellDigit(
	work: LatticeWorkState,
	solution: MultiplicationSolution,
	row: number,
	col: number,
	half: "tens" | "ones",
	digit: string,
): LatticeWorkState {
	const cellSolution = solution.lattice.cells[row]?.[col];
	const cellWork = work.cells[row]?.[col];
	if (!cellSolution || !cellWork) return work;

	const expected =
		half === "tens" ? cellSolution.tensDigit : cellSolution.onesDigit;
	const status = digit === String(expected) ? "correct" : "incorrect";
	const nextCells = work.cells.map((cellsRow, rowIndex) =>
		cellsRow.map((entry, colIndex) => {
			if (rowIndex !== row || colIndex !== col) return entry;
			return {
				...entry,
				[half]: {
					answer: digit,
					status,
				},
			};
		}),
	);
	const nextWork = {
		...work,
		cells: nextCells,
	};
	return { ...nextWork, solved: computeLatticeSolved(nextWork) };
}

export function enterLatticeDiagonalDigit(
	work: LatticeWorkState,
	solution: MultiplicationSolution,
	index: number,
	digit: string,
): LatticeWorkState {
	const diagonal = solution.lattice.diagonals[index];
	if (!diagonal) return work;

	const status = digit === String(diagonal.resultDigit) ? "correct" : "incorrect";
	const diagonals = work.diagonals.map((entry, diagonalIndex): LatticeWorkEntry =>
		diagonalIndex === index ? { answer: digit, status } : entry,
	);
	const nextWork = {
		...work,
		diagonals,
	};
	return { ...nextWork, solved: computeLatticeSolved(nextWork) };
}

function randInt(min: number, max: number, random: () => number): number {
	return Math.floor(random() * (max - min + 1)) + min;
}

export function computeMultiplicationSolution(
	problem: MultiplicationProblem,
): MultiplicationSolution {
	const zero: MultiplicationColumnSolution = {
		carryIn: 0,
		rawProduct: 0,
		answerDigit: 0,
		carryOut: 0,
	};
	const partialProducts: PartialProductRow[] = [];
	const digitProducts: DigitProduct[] = [];

	for (let shift = 0; shift < problem.multiplierPlaces; shift++) {
		const multiplierDigit = Math.floor(problem.multiplier / 10 ** shift) % 10;
		const columns: Record<Place, MultiplicationColumnSolution> = {
			ones_pl: { ...zero },
			tens_pl: { ...zero },
			hundreds_pl: { ...zero },
			thousands_pl: { ...zero },
		};
		let carry = 0;
		for (let i = 0; i < problem.numPlaces; i++) {
			const place = PLACES[i];
			const multiplicandDigit = problem.multiplicand[place];
			const product = multiplicandDigit * multiplierDigit;
			const raw = product + carry;
			digitProducts.push({
				multiplicandPlace: place,
				multiplicandDigit,
				multiplierDigit,
				multiplierShift: shift,
				shift: i + shift,
				product,
				onesDigit: product % 10,
				tensDigit: Math.floor(product / 10),
			});
			columns[place] = {
				carryIn: carry,
				rawProduct: raw,
				answerDigit: raw % 10,
				carryOut: Math.floor(raw / 10),
			};
			carry = columns[place].carryOut;
		}
		partialProducts.push({
			multiplierDigit,
			shift,
			columns,
			finalCarryOut: carry,
		});
	}

	const multiplicandValue = toNumber(problem.multiplicand);
	const productValue = multiplicandValue * problem.multiplier;

	const finalResult: FinalResultRow = {
		digits: decompose(productValue),
		overflow: Math.floor(productValue / 10000),
	};

	const displayWidth = problem.numPlaces + problem.multiplierPlaces - 1;
	const finalAdditionCarryIns: Partial<Record<Place, number>> = {};
	let addCarry = 0;
	for (let placeIndex = 0; placeIndex < displayWidth; placeIndex++) {
		finalAdditionCarryIns[PLACES[placeIndex]] = addCarry;
		let colSum = addCarry;
		for (let rowIdx = 0; rowIdx < problem.multiplierPlaces; rowIdx++) {
			const effectivePlaceIndex = placeIndex - rowIdx;
			if (effectivePlaceIndex >= 0 && effectivePlaceIndex < problem.numPlaces) {
				colSum +=
					partialProducts[rowIdx].columns[PLACES[effectivePlaceIndex]]
						.answerDigit;
			} else if (effectivePlaceIndex === problem.numPlaces) {
				colSum += partialProducts[rowIdx].finalCarryOut;
			}
		}
		addCarry = Math.floor(colSum / 10);
	}

	const latticeCells: LatticeCellSolution[][] = Array.from(
		{ length: problem.multiplierPlaces },
		(_, row) =>
			Array.from({ length: problem.numPlaces }, (_, col) => {
				const multiplicandPlaceIndex = problem.numPlaces - 1 - col;
				const multiplicandPlace = PLACES[multiplicandPlaceIndex];
				const multiplierShift = problem.multiplierPlaces - 1 - row;
				const multiplierDigit =
					Math.floor(problem.multiplier / 10 ** multiplierShift) % 10;
				const multiplicandDigit = problem.multiplicand[multiplicandPlace];
				const product = multiplicandDigit * multiplierDigit;
				return {
					row,
					col,
					multiplicandPlace,
					multiplicandDigit,
					multiplierDigit,
					multiplierShift,
					product,
					tensDigit: Math.floor(product / 10),
					onesDigit: product % 10,
					tensDiagonal: multiplicandPlaceIndex + multiplierShift + 1,
					onesDiagonal: multiplicandPlaceIndex + multiplierShift,
				};
			}),
	);

	const latticeDiagonals: LatticeDiagonalSolution[] = [];
	let latticeCarry = 0;
	for (
		let diagonalIndex = 0;
		diagonalIndex < problem.numPlaces + problem.multiplierPlaces;
		diagonalIndex++
	) {
		const contributions: number[] = [];
		for (const row of latticeCells) {
			for (const cell of row) {
				if (cell.onesDiagonal === diagonalIndex) contributions.push(cell.onesDigit);
				if (cell.tensDiagonal === diagonalIndex) contributions.push(cell.tensDigit);
			}
		}
		const sum = contributions.reduce((total, value) => total + value, latticeCarry);
		const carryIn = latticeCarry;
		const resultDigit = sum % 10;
		const carryOut = Math.floor(sum / 10);
		latticeDiagonals.push({
			index: diagonalIndex,
			contributions,
			carryIn,
			sum,
			resultDigit,
			carryOut,
		});
		latticeCarry = carryOut;
	}

	return {
		partialProducts,
		digitProducts,
		finalResult,
		finalAdditionCarryIns,
		lattice: {
			cells: latticeCells,
			diagonals: latticeDiagonals,
		},
	};
}

export function generateMultiplicationProblem(
	difficulty: MultiplicationDifficulty,
	random: () => number = Math.random,
): MultiplicationProblem {
	const { numPlaces } = difficulty;
	const multiplierPlaces = Math.min(
		difficulty.multiplierPlaces,
		numPlaces,
	) as MultiplicationDifficulty["multiplierPlaces"];

	const multiplicand: PlaceValues = {
		ones_pl: 0,
		tens_pl: 0,
		hundreds_pl: 0,
		thousands_pl: 0,
	};

	for (let i = 0; i < numPlaces; i++) {
		const place = PLACES[i];
		const isLeading = i === numPlaces - 1;
		multiplicand[place] = isLeading
			? randInt(1, 9, random)
			: randInt(0, 9, random);
	}

	// Generate multiplierPlaces-digit multiplier (leading digit ≥ 1)
	let multiplier = 0;
	for (let i = 0; i < multiplierPlaces; i++) {
		const isLeading = i === multiplierPlaces - 1;
		const digit = isLeading ? randInt(1, 9, random) : randInt(0, 9, random);
		multiplier += digit * 10 ** i;
	}

	return { multiplicand, multiplier, numPlaces, multiplierPlaces };
}
