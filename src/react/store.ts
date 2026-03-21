import {
	type AdditionDifficulty,
	type AdditionProblem,
	type AdditionSolution,
	PLACES,
	type Place,
	computeSolution,
	generateAdditionProblem,
} from "@domain/addition";
import { type Attempt, createAttempt } from "@domain/attempt";
import {
	type FinalSumWork,
	type MultiplicationDifficulty,
	type MultiplicationProblem,
	type MultiplicationSolution,
	type PartialProductRow,
	computeMultiplicationSolution,
	enterFinalAdditionCarry,
	enterFinalSumDigit,
	enterFinalSumOverflow,
	generateMultiplicationProblem,
	initialFinalSumWork,
} from "@domain/multiplication";
import type { StoragePort } from "@domain/ports";
import {
	type SubtractionDifficulty,
	type SubtractionProblem,
	type SubtractionSolution,
	computeSubtractionSolution,
	generateSubtractionProblem,
} from "@domain/subtraction";
import {
	type VisualWorkState,
	type VisualZone,
	applyCarryOut,
	applyMoveDisk,
	initialVisualWork,
} from "@domain/visual-addition";
import {
	type VisualSubWorkState,
	applySubBorrowFrom,
	applySubCancel,
	applySubMoveBorrowDown,
	initialVisualSubWork,
} from "@domain/visual-subtraction";
import { InMemoryStorage } from "@infrastructure/in-memory-storage";
import { create } from "zustand";

export type CellStatus = "idle" | "correct" | "incorrect";

export type Mode = "digit" | "visual";

type PlaceWorkEntry = {
	answer: string; // "" | "0"–"9"
	answerStatus: CellStatus;
	carry: string; // "" | "0"–"9" (carry-out of this column)
	carryStatus: CellStatus;
};

type WorkState = {
	entries: Record<Place, PlaceWorkEntry>;
	finalCarry: string;
	finalCarryStatus: CellStatus;
	unlockedUpTo: number;
	solved: boolean;
};

type SubtractionPlaceWorkEntry = {
	answer: string;
	answerStatus: CellStatus;
	borrow: string;
	borrowStatus: CellStatus;
	effectiveValue: string;
	effectiveValueStatus: CellStatus;
};

type SubtractionWorkState = {
	entries: Record<Place, SubtractionPlaceWorkEntry>;
	unlockedUpTo: number;
	solved: boolean;
};

type MultiplicationWorkState = {
	rows: WorkState[]; // one per multiplier digit (index 0 = ones digit)
	activeRow: number;
	solved: boolean;
};

type State = {
	problem: AdditionProblem;
	difficulty: AdditionDifficulty;
	solution: AdditionSolution;
	work: WorkState;
	visualWork: VisualWorkState;
	mode: Mode;
	attempts: Attempt[];
	periodStart: number;
	operation: "addition" | "subtraction" | "multiplication";
	subtractionDifficulty: SubtractionDifficulty;
	subtractionProblem: SubtractionProblem;
	subtractionSolution: SubtractionSolution;
	subtractionWork: SubtractionWorkState;
	visualSubWork: VisualSubWorkState;
	multiplicationDifficulty: MultiplicationDifficulty;
	multiplicationProblem: MultiplicationProblem;
	multiplicationSolution: MultiplicationSolution;
	multiplicationWork: MultiplicationWorkState;
	finalSumWork: FinalSumWork;
	toolboxOpen: boolean;
};

type Actions = {
	newProblem: () => void;
	setDifficulty: (difficulty: AdditionDifficulty) => void;
	enterAnswer: (place: Place, digit: string) => void;
	enterCarry: (place: Place, digit: string) => void;
	enterFinalCarry: (digit: string) => void;
	resetPeriod: () => void;
	setMode: (mode: Mode) => void;
	moveVisualDisk: (place: Place, from: VisualZone) => void;
	carryVisual: (place: Place, zone: VisualZone) => void;
	setOperation: (op: "addition" | "subtraction" | "multiplication") => void;
	setSubtractionDifficulty: (difficulty: SubtractionDifficulty) => void;
	setMultiplicationDifficulty: (difficulty: MultiplicationDifficulty) => void;
	setToolboxOpen: (open: boolean) => void;
	enterSubtractionAnswer: (place: Place, digit: string) => void;
	enterSubtractionBorrow: (place: Place, digit: string) => void;
	enterSubtractionEffectiveValue: (place: Place, digit: string) => void;
	cancelVisualSub: (place: Place) => void;
	moveBorrowDownVisualSub: (place: Place) => void;
	borrowVisualSub: (fromPlace: Place) => void;
	enterMultiplicationAnswer: (place: Place, digit: string) => void;
	enterMultiplicationCarry: (place: Place, digit: string) => void;
	enterMultiplicationFinalCarry: (digit: string) => void;
	enterMultiplicationFinalSum: (place: Place, digit: string) => void;
	enterMultiplicationFinalAdditionCarry: (place: Place, digit: string) => void;
	enterMultiplicationFinalSumOverflow: (digit: string) => void;
};

const DEFAULT_DIFFICULTY: AdditionDifficulty = { numPlaces: 3, numCarries: 2 };
const DEFAULT_SUBTRACTION_DIFFICULTY: SubtractionDifficulty = {
	numPlaces: 3,
	numBorrows: 2,
};
const DEFAULT_MULTIPLICATION_DIFFICULTY: MultiplicationDifficulty = {
	numPlaces: 2,
	multiplierPlaces: 1,
};

let _storage: StoragePort = new InMemoryStorage();

function midnightToday(): number {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d.getTime();
}

export function initializeStorage(storage: StoragePort): void {
	_storage = storage;

	const savedDifficulty = storage.getDifficulty();
	const savedSubtractionDifficulty = storage.getSubtractionDifficulty();
	const savedMultiplicationDifficulty = storage.getMultiplicationDifficulty();
	const attempts = storage.getAttempts();
	const savedPeriodStart = storage.getPeriodStart();
	const periodStart =
		savedPeriodStart !== null ? savedPeriodStart : midnightToday();
	if (savedPeriodStart === null) {
		storage.savePeriodStart(periodStart);
	}

	const nextState: Partial<State> = { attempts, periodStart };

	if (savedDifficulty) {
		const problem = generateAdditionProblem(savedDifficulty);
		nextState.difficulty = savedDifficulty;
		nextState.problem = problem;
		nextState.solution = computeSolution(problem);
		nextState.work = initialWork();
		nextState.visualWork = initialVisualWork(problem);
	}

	if (savedSubtractionDifficulty) {
		const subProb = generateSubtractionProblem(savedSubtractionDifficulty);
		nextState.subtractionDifficulty = savedSubtractionDifficulty;
		nextState.subtractionProblem = subProb;
		nextState.subtractionSolution = computeSubtractionSolution(subProb);
		nextState.subtractionWork = initialSubtractionWork();
		nextState.visualSubWork = initialVisualSubWork(subProb);
	}

	if (
		savedMultiplicationDifficulty &&
		"multiplierPlaces" in savedMultiplicationDifficulty
	) {
		const mulProb = generateMultiplicationProblem(
			savedMultiplicationDifficulty,
		);
		nextState.multiplicationDifficulty = savedMultiplicationDifficulty;
		nextState.multiplicationProblem = mulProb;
		nextState.multiplicationSolution = computeMultiplicationSolution(mulProb);
		nextState.multiplicationWork = initialMultiplicationWork(
			savedMultiplicationDifficulty.multiplierPlaces,
		);
		nextState.finalSumWork = initialFinalSumWorkForProblem(mulProb);
	}

	useAdditionStore.setState(nextState);
}

function emptyEntry(): PlaceWorkEntry {
	return {
		answer: "",
		answerStatus: "idle",
		carry: "",
		carryStatus: "idle",
	};
}

function initialWork(): WorkState {
	return {
		entries: {
			ones_pl: emptyEntry(),
			tens_pl: emptyEntry(),
			hundreds_pl: emptyEntry(),
			thousands_pl: emptyEntry(),
		},
		finalCarry: "",
		finalCarryStatus: "idle",
		unlockedUpTo: 0,
		solved: false,
	};
}

function emptySubtractionEntry(): SubtractionPlaceWorkEntry {
	return {
		answer: "",
		answerStatus: "idle",
		borrow: "",
		borrowStatus: "idle",
		effectiveValue: "",
		effectiveValueStatus: "idle",
	};
}

function initialSubtractionWork(): SubtractionWorkState {
	return {
		entries: {
			ones_pl: emptySubtractionEntry(),
			tens_pl: emptySubtractionEntry(),
			hundreds_pl: emptySubtractionEntry(),
			thousands_pl: emptySubtractionEntry(),
		},
		unlockedUpTo: 0,
		solved: false,
	};
}

function initialMultiplicationWork(
	multiplierPlaces: number,
): MultiplicationWorkState {
	return {
		rows: Array.from({ length: multiplierPlaces }, () => initialWork()),
		activeRow: 0,
		solved: false,
	};
}

function initialFinalSumWorkForProblem(
	problem: MultiplicationProblem,
): FinalSumWork {
	const displayWidth = problem.numPlaces + problem.multiplierPlaces - 1;
	return initialFinalSumWork(displayWidth);
}

function advanceIfComplete(
	index: number,
	updatedEntries: Record<Place, PlaceWorkEntry>,
	work: WorkState,
	solution: AdditionSolution,
	numPlaces: number,
): Partial<WorkState> {
	const place = PLACES[index];
	const entry = updatedEntries[place];
	const col = solution.columns[place];

	const answerCorrect = entry.answerStatus === "correct";
	// The leading column's carry-out is the finalCarry, entered separately in the
	// answer row — there is no scratch-row input for it, so skip the carry check.
	const isLeading = index === numPlaces - 1;
	const carryCorrect =
		isLeading || col.carryOut === 0 || entry.carryStatus === "correct";
	const columnComplete = answerCorrect && carryCorrect;

	if (!columnComplete || index !== work.unlockedUpTo) {
		return {};
	}

	const nextIndex = index + 1;
	if (nextIndex < numPlaces) {
		return { unlockedUpTo: nextIndex };
	}
	if (solution.finalCarryOut === 0) {
		return { solved: true };
	}
	return { unlockedUpTo: numPlaces }; // unlock final carry-out column
}

function multiplicationAdvanceIfComplete(
	index: number,
	updatedEntries: Record<Place, PlaceWorkEntry>,
	work: WorkState,
	row: PartialProductRow,
	numPlaces: number,
): Partial<WorkState> {
	const place = PLACES[index];
	const entry = updatedEntries[place];
	const col = row.columns[place];

	const answerCorrect = entry.answerStatus === "correct";
	const isLeading = index === numPlaces - 1;
	const carryCorrect =
		isLeading || col.carryOut === 0 || entry.carryStatus === "correct";
	const columnComplete = answerCorrect && carryCorrect;

	if (!columnComplete || index !== work.unlockedUpTo) {
		return {};
	}

	const nextIndex = index + 1;
	if (nextIndex < numPlaces) {
		return { unlockedUpTo: nextIndex };
	}
	if (row.finalCarryOut === 0) {
		return { solved: true };
	}
	return { unlockedUpTo: numPlaces };
}

function subtractionAdvanceIfComplete(
	index: number,
	updatedEntries: Record<Place, SubtractionPlaceWorkEntry>,
	work: SubtractionWorkState,
	solution: SubtractionSolution,
	numPlaces: number,
): Partial<SubtractionWorkState> {
	const place = PLACES[index];
	const entry = updatedEntries[place];
	const col = solution.columns[place];

	const answerCorrect = entry.answerStatus === "correct";
	const nextPlace = index + 1 < numPlaces ? PLACES[index + 1] : null;
	const borrowCorrect =
		col.borrowOut === 0 ||
		(nextPlace !== null &&
			updatedEntries[nextPlace].borrowStatus === "correct");
	const effectiveValueCorrect =
		col.borrowOut === 0 || entry.effectiveValueStatus === "correct";
	const columnComplete =
		answerCorrect && borrowCorrect && effectiveValueCorrect;

	if (!columnComplete || index !== work.unlockedUpTo) {
		return {};
	}

	const nextIndex = index + 1;
	if (nextIndex < numPlaces) {
		return { unlockedUpTo: nextIndex };
	}
	return { solved: true };
}

function recordAttemptInternal(
	numPlaces: 1 | 2 | 3 | 4,
	correct: boolean,
): void {
	const { mode, operation } = useAdditionStore.getState();
	const attempt = createAttempt(numPlaces, correct, mode, operation);
	_storage.saveAttempt(attempt);
	useAdditionStore.setState((s) => ({ attempts: [...s.attempts, attempt] }));
}

const initialProblem = generateAdditionProblem(DEFAULT_DIFFICULTY);
const initialSubtractionProblem = generateSubtractionProblem(
	DEFAULT_SUBTRACTION_DIFFICULTY,
);
const initialVisualSubWorkState = initialVisualSubWork(
	initialSubtractionProblem,
);
const initialMultiplicationProblem = generateMultiplicationProblem(
	DEFAULT_MULTIPLICATION_DIFFICULTY,
);

export const useAdditionStore = create<State & Actions>()((set, get) => ({
	difficulty: DEFAULT_DIFFICULTY,
	problem: initialProblem,
	solution: computeSolution(initialProblem),
	work: initialWork(),
	visualWork: initialVisualWork(initialProblem),
	mode: "visual" as Mode,
	attempts: [],
	periodStart: midnightToday(),
	operation: "addition" as "addition" | "subtraction" | "multiplication",
	subtractionDifficulty: DEFAULT_SUBTRACTION_DIFFICULTY,
	subtractionProblem: initialSubtractionProblem,
	subtractionSolution: computeSubtractionSolution(initialSubtractionProblem),
	subtractionWork: initialSubtractionWork(),
	visualSubWork: initialVisualSubWorkState,
	multiplicationDifficulty: DEFAULT_MULTIPLICATION_DIFFICULTY,
	multiplicationProblem: initialMultiplicationProblem,
	multiplicationSolution: computeMultiplicationSolution(
		initialMultiplicationProblem,
	),
	multiplicationWork: initialMultiplicationWork(
		DEFAULT_MULTIPLICATION_DIFFICULTY.multiplierPlaces,
	),
	finalSumWork: initialFinalSumWorkForProblem(initialMultiplicationProblem),
	toolboxOpen: false,

	newProblem: () => {
		const {
			operation,
			work,
			visualWork,
			problem,
			subtractionWork,
			visualSubWork,
			subtractionProblem,
			difficulty,
			subtractionDifficulty,
			multiplicationWork,
			multiplicationProblem,
			multiplicationDifficulty,
			mode,
		} = get();

		if (operation === "subtraction") {
			const subActiveSolved =
				mode === "visual" ? visualSubWork.solved : subtractionWork.solved;
			if (!subActiveSolved) {
				recordAttemptInternal(subtractionProblem.numPlaces, false);
			}
			const newProb = generateSubtractionProblem(subtractionDifficulty);
			set({
				subtractionProblem: newProb,
				subtractionSolution: computeSubtractionSolution(newProb),
				subtractionWork: initialSubtractionWork(),
				visualSubWork: initialVisualSubWork(newProb),
			});
		} else if (operation === "multiplication") {
			if (!multiplicationWork.solved) {
				recordAttemptInternal(multiplicationProblem.numPlaces, false);
			}
			const newProb = generateMultiplicationProblem(multiplicationDifficulty);
			set({
				multiplicationProblem: newProb,
				multiplicationSolution: computeMultiplicationSolution(newProb),
				multiplicationWork: initialMultiplicationWork(
					multiplicationDifficulty.multiplierPlaces,
				),
				finalSumWork: initialFinalSumWorkForProblem(newProb),
			});
		} else {
			const activeModeSolved =
				mode === "visual" ? visualWork.solved : work.solved;
			if (!activeModeSolved) {
				recordAttemptInternal(problem.numPlaces, false);
			}
			const newProb = generateAdditionProblem(difficulty);
			set({
				problem: newProb,
				solution: computeSolution(newProb),
				work: initialWork(),
				visualWork: initialVisualWork(newProb),
			});
		}
	},

	setDifficulty: (difficulty: AdditionDifficulty) => {
		const { work, visualWork, problem, mode } = get();
		const activeModeSolved =
			mode === "visual" ? visualWork.solved : work.solved;
		if (!activeModeSolved) {
			recordAttemptInternal(problem.numPlaces, false);
		}
		const clamped: AdditionDifficulty = {
			numPlaces: difficulty.numPlaces,
			numCarries: Math.min(
				difficulty.numCarries,
				difficulty.numPlaces,
			) as AdditionDifficulty["numCarries"],
		};
		_storage.saveDifficulty(clamped);
		const newProb = generateAdditionProblem(clamped);
		set({
			difficulty: clamped,
			problem: newProb,
			solution: computeSolution(newProb),
			work: initialWork(),
			visualWork: initialVisualWork(newProb),
		});
	},

	enterAnswer: (place: Place, digit: string) => {
		const { solution, work, problem } = get();
		const index = PLACES.indexOf(place);
		if (index > work.unlockedUpTo) return;

		const col = solution.columns[place];
		const correct = digit === String(col.answerDigit);
		const answerStatus: CellStatus = correct ? "correct" : "incorrect";

		const updatedEntries: Record<Place, PlaceWorkEntry> = {
			...work.entries,
			[place]: {
				...work.entries[place],
				answer: digit,
				answerStatus,
			},
		};

		const advance = advanceIfComplete(
			index,
			updatedEntries,
			work,
			solution,
			problem.numPlaces,
		);

		if (advance.solved === true) {
			recordAttemptInternal(problem.numPlaces, true);
		}

		set({ work: { ...work, entries: updatedEntries, ...advance } });
	},

	enterCarry: (place: Place, digit: string) => {
		const { solution, work, problem } = get();
		const index = PLACES.indexOf(place);
		if (index > work.unlockedUpTo) return;

		const col = solution.columns[place];
		const correct = digit === String(col.carryOut);
		const carryStatus: CellStatus = correct ? "correct" : "incorrect";

		const updatedEntries: Record<Place, PlaceWorkEntry> = {
			...work.entries,
			[place]: {
				...work.entries[place],
				carry: digit,
				carryStatus,
			},
		};

		const advance = advanceIfComplete(
			index,
			updatedEntries,
			work,
			solution,
			problem.numPlaces,
		);

		if (advance.solved === true) {
			recordAttemptInternal(problem.numPlaces, true);
		}

		set({ work: { ...work, entries: updatedEntries, ...advance } });
	},

	enterFinalCarry: (digit: string) => {
		const { solution, work, problem } = get();
		const correct = digit === String(solution.finalCarryOut);
		const finalCarryStatus: CellStatus = correct ? "correct" : "incorrect";

		if (correct) {
			recordAttemptInternal(problem.numPlaces, true);
		}

		set({
			work: {
				...work,
				finalCarry: digit,
				finalCarryStatus,
				solved: correct,
			},
		});
	},

	resetPeriod: () => {
		const ts = Date.now();
		_storage.savePeriodStart(ts);
		set({ periodStart: ts });
	},

	setMode: (mode: Mode) => {
		set({ mode });
	},

	setToolboxOpen: (open: boolean) => {
		set({ toolboxOpen: open });
	},

	moveVisualDisk: (place: Place, from: VisualZone) => {
		const { visualWork, problem } = get();
		const newWork = applyMoveDisk(visualWork, place, from, problem.numPlaces);
		if (newWork.solved && !visualWork.solved) {
			recordAttemptInternal(problem.numPlaces, true);
		}
		set({ visualWork: newWork });
	},

	carryVisual: (place: Place, zone: VisualZone) => {
		const { visualWork, problem } = get();
		const newWork = applyCarryOut(visualWork, place, zone, problem.numPlaces);
		if (newWork.solved && !visualWork.solved) {
			recordAttemptInternal(problem.numPlaces, true);
		}
		set({ visualWork: newWork });
	},

	setOperation: (op: "addition" | "subtraction" | "multiplication") => {
		const {
			operation,
			work,
			visualWork,
			problem,
			subtractionWork,
			visualSubWork,
			subtractionProblem,
			multiplicationWork,
			multiplicationProblem,
			mode,
		} = get();
		if (operation === op) return;

		if (operation === "addition") {
			const activeModeSolved =
				mode === "visual" ? visualWork.solved : work.solved;
			if (!activeModeSolved) {
				recordAttemptInternal(problem.numPlaces, false);
			}
		} else if (operation === "subtraction") {
			const subActiveSolved =
				mode === "visual" ? visualSubWork.solved : subtractionWork.solved;
			if (!subActiveSolved) {
				recordAttemptInternal(subtractionProblem.numPlaces, false);
			}
		} else {
			// multiplication
			if (!multiplicationWork.solved) {
				recordAttemptInternal(multiplicationProblem.numPlaces, false);
			}
		}

		set({ operation: op });
	},

	setSubtractionDifficulty: (difficulty: SubtractionDifficulty) => {
		const { subtractionWork, visualSubWork, subtractionProblem, mode } = get();
		const subActiveSolved =
			mode === "visual" ? visualSubWork.solved : subtractionWork.solved;
		if (!subActiveSolved) {
			recordAttemptInternal(subtractionProblem.numPlaces, false);
		}
		const clampedBorrows = Math.min(
			difficulty.numBorrows,
			difficulty.numPlaces - 1,
		);
		const clamped: SubtractionDifficulty = {
			numPlaces: difficulty.numPlaces,
			numBorrows: clampedBorrows as SubtractionDifficulty["numBorrows"],
		};
		_storage.saveSubtractionDifficulty(clamped);
		const newProb = generateSubtractionProblem(clamped);
		set({
			subtractionDifficulty: clamped,
			subtractionProblem: newProb,
			subtractionSolution: computeSubtractionSolution(newProb),
			subtractionWork: initialSubtractionWork(),
			visualSubWork: initialVisualSubWork(newProb),
		});
	},

	setMultiplicationDifficulty: (difficulty: MultiplicationDifficulty) => {
		const { multiplicationWork, multiplicationProblem } = get();
		if (!multiplicationWork.solved) {
			recordAttemptInternal(multiplicationProblem.numPlaces, false);
		}
		_storage.saveMultiplicationDifficulty(difficulty);
		const newProb = generateMultiplicationProblem(difficulty);
		set({
			multiplicationDifficulty: difficulty,
			multiplicationProblem: newProb,
			multiplicationSolution: computeMultiplicationSolution(newProb),
			multiplicationWork: initialMultiplicationWork(
				difficulty.multiplierPlaces,
			),
			finalSumWork: initialFinalSumWorkForProblem(newProb),
		});
	},

	enterSubtractionAnswer: (place: Place, digit: string) => {
		const { subtractionSolution, subtractionWork, subtractionProblem } = get();
		const index = PLACES.indexOf(place);
		if (index > subtractionWork.unlockedUpTo) return;

		const col = subtractionSolution.columns[place];
		const correct = digit === String(col.answerDigit);
		const answerStatus: CellStatus = correct ? "correct" : "incorrect";

		const updatedEntries: Record<Place, SubtractionPlaceWorkEntry> = {
			...subtractionWork.entries,
			[place]: {
				...subtractionWork.entries[place],
				answer: digit,
				answerStatus,
			},
		};

		const advance = subtractionAdvanceIfComplete(
			index,
			updatedEntries,
			subtractionWork,
			subtractionSolution,
			subtractionProblem.numPlaces,
		);

		if (advance.solved === true) {
			recordAttemptInternal(subtractionProblem.numPlaces, true);
		}

		set({
			subtractionWork: {
				...subtractionWork,
				entries: updatedEntries,
				...advance,
			},
		});
	},

	enterSubtractionBorrow: (place: Place, digit: string) => {
		const { subtractionSolution, subtractionWork, subtractionProblem } = get();
		// place is the borrowed-from column (i+1); borrowing column is index-1
		const index = PLACES.indexOf(place);
		if (index - 1 !== subtractionWork.unlockedUpTo) return;

		const col = subtractionSolution.columns[place];
		// Correct answer is the reduced digit written above the borrowed-from column
		const correct = digit === String(col.effectiveTop);
		const borrowStatus: CellStatus = correct ? "correct" : "incorrect";

		const updatedEntries: Record<Place, SubtractionPlaceWorkEntry> = {
			...subtractionWork.entries,
			[place]: {
				...subtractionWork.entries[place],
				borrow: digit,
				borrowStatus,
			},
		};

		// Advance based on the borrowing column (index-1)
		const advance = subtractionAdvanceIfComplete(
			index - 1,
			updatedEntries,
			subtractionWork,
			subtractionSolution,
			subtractionProblem.numPlaces,
		);

		if (advance.solved === true) {
			recordAttemptInternal(subtractionProblem.numPlaces, true);
		}

		set({
			subtractionWork: {
				...subtractionWork,
				entries: updatedEntries,
				...advance,
			},
		});
	},

	enterSubtractionEffectiveValue: (place: Place, digit: string) => {
		const { subtractionSolution, subtractionWork, subtractionProblem } = get();
		const index = PLACES.indexOf(place);
		if (index !== subtractionWork.unlockedUpTo) return;

		const col = subtractionSolution.columns[place];
		const correct = digit === String(col.effectiveTop + 10);
		const effectiveValueStatus: CellStatus = correct ? "correct" : "incorrect";

		const updatedEntries: Record<Place, SubtractionPlaceWorkEntry> = {
			...subtractionWork.entries,
			[place]: {
				...subtractionWork.entries[place],
				effectiveValue: digit,
				effectiveValueStatus,
			},
		};

		const advance = subtractionAdvanceIfComplete(
			index,
			updatedEntries,
			subtractionWork,
			subtractionSolution,
			subtractionProblem.numPlaces,
		);

		if (advance.solved === true) {
			recordAttemptInternal(subtractionProblem.numPlaces, true);
		}

		set({
			subtractionWork: {
				...subtractionWork,
				entries: updatedEntries,
				...advance,
			},
		});
	},

	cancelVisualSub: (place: Place) => {
		const { visualSubWork, subtractionProblem } = get();
		const newWork = applySubCancel(
			visualSubWork,
			place,
			subtractionProblem.numPlaces,
		);
		if (newWork.solved && !visualSubWork.solved) {
			recordAttemptInternal(subtractionProblem.numPlaces, true);
		}
		set({ visualSubWork: newWork });
	},

	moveBorrowDownVisualSub: (place: Place) => {
		const { visualSubWork, subtractionProblem } = get();
		const newWork = applySubMoveBorrowDown(
			visualSubWork,
			place,
			subtractionProblem.numPlaces,
		);
		if (newWork.solved && !visualSubWork.solved) {
			recordAttemptInternal(subtractionProblem.numPlaces, true);
		}
		set({ visualSubWork: newWork });
	},

	borrowVisualSub: (fromPlace: Place) => {
		const { visualSubWork, subtractionProblem } = get();
		const newWork = applySubBorrowFrom(
			visualSubWork,
			fromPlace,
			subtractionProblem.numPlaces,
		);
		if (newWork.solved && !visualSubWork.solved) {
			recordAttemptInternal(subtractionProblem.numPlaces, true);
		}
		set({ visualSubWork: newWork });
	},

	enterMultiplicationAnswer: (place: Place, digit: string) => {
		const {
			multiplicationSolution,
			multiplicationWork,
			multiplicationProblem,
		} = get();
		const { rows, activeRow } = multiplicationWork;
		const currentRow = rows[activeRow];
		const index = PLACES.indexOf(place);
		if (index > currentRow.unlockedUpTo) return;

		const col =
			multiplicationSolution.partialProducts[activeRow].columns[place];
		const correct = digit === String(col.answerDigit);
		const answerStatus: CellStatus = correct ? "correct" : "incorrect";

		const updatedEntries: Record<Place, PlaceWorkEntry> = {
			...currentRow.entries,
			[place]: {
				...currentRow.entries[place],
				answer: digit,
				answerStatus,
			},
		};

		const advance = multiplicationAdvanceIfComplete(
			index,
			updatedEntries,
			currentRow,
			multiplicationSolution.partialProducts[activeRow],
			multiplicationProblem.numPlaces,
		);

		let newActiveRow = activeRow;

		if (advance.solved === true) {
			if (activeRow + 1 < multiplicationProblem.multiplierPlaces) {
				newActiveRow = activeRow + 1;
			}
			// else: partial products done — finalSumWork handles overall solved
		}

		const updatedRows = rows.map((row, i) =>
			i === activeRow
				? { ...currentRow, entries: updatedEntries, ...advance }
				: row,
		);

		set({
			multiplicationWork: {
				...multiplicationWork,
				rows: updatedRows,
				activeRow: newActiveRow,
			},
		});
	},

	enterMultiplicationCarry: (place: Place, digit: string) => {
		const {
			multiplicationSolution,
			multiplicationWork,
			multiplicationProblem,
		} = get();
		const { rows, activeRow } = multiplicationWork;
		const currentRow = rows[activeRow];
		const index = PLACES.indexOf(place);

		const col =
			multiplicationSolution.partialProducts[activeRow].columns[place];
		const correct = digit === String(col.carryOut);
		const carryStatus: CellStatus = correct ? "correct" : "incorrect";

		const updatedEntries: Record<Place, PlaceWorkEntry> = {
			...currentRow.entries,
			[place]: {
				...currentRow.entries[place],
				carry: digit,
				carryStatus,
			},
		};

		const advance = multiplicationAdvanceIfComplete(
			index,
			updatedEntries,
			currentRow,
			multiplicationSolution.partialProducts[activeRow],
			multiplicationProblem.numPlaces,
		);

		let newActiveRow = activeRow;

		if (advance.solved === true) {
			if (activeRow + 1 < multiplicationProblem.multiplierPlaces) {
				newActiveRow = activeRow + 1;
			}
			// else: partial products done — finalSumWork handles overall solved
		}

		const updatedRows = rows.map((row, i) =>
			i === activeRow
				? { ...currentRow, entries: updatedEntries, ...advance }
				: row,
		);

		set({
			multiplicationWork: {
				...multiplicationWork,
				rows: updatedRows,
				activeRow: newActiveRow,
			},
		});
	},

	enterMultiplicationFinalCarry: (digit: string) => {
		const {
			multiplicationSolution,
			multiplicationWork,
			multiplicationProblem,
		} = get();
		const { rows, activeRow } = multiplicationWork;
		const currentRow = rows[activeRow];
		const correct =
			digit ===
			String(multiplicationSolution.partialProducts[activeRow].finalCarryOut);
		const finalCarryStatus: CellStatus = correct ? "correct" : "incorrect";

		const updatedCurrentRow: WorkState = {
			...currentRow,
			finalCarry: digit,
			finalCarryStatus,
			solved: correct,
		};

		let newActiveRow = activeRow;

		if (correct) {
			if (activeRow + 1 < multiplicationProblem.multiplierPlaces) {
				newActiveRow = activeRow + 1;
			}
			// else: partial products done — finalSumWork handles overall solved
		}

		const updatedRows = rows.map((row, i) =>
			i === activeRow ? updatedCurrentRow : row,
		);

		set({
			multiplicationWork: {
				...multiplicationWork,
				rows: updatedRows,
				activeRow: newActiveRow,
			},
		});
	},

	enterMultiplicationFinalSum: (place: Place, digit: string) => {
		const {
			multiplicationSolution,
			multiplicationWork,
			multiplicationProblem,
			finalSumWork,
		} = get();
		const displayWidth =
			multiplicationProblem.numPlaces +
			multiplicationProblem.multiplierPlaces -
			1;
		const newFinalSumWork = enterFinalSumDigit(
			finalSumWork,
			multiplicationSolution,
			place,
			digit,
			displayWidth,
		);
		const partialProductsSolved = multiplicationWork.rows.every(
			(r) => r.solved,
		);
		const overallSolved = partialProductsSolved && newFinalSumWork.solved;

		if (overallSolved && !multiplicationWork.solved) {
			recordAttemptInternal(multiplicationProblem.numPlaces, true);
		}

		set({
			finalSumWork: newFinalSumWork,
			multiplicationWork: { ...multiplicationWork, solved: overallSolved },
		});
	},

	enterMultiplicationFinalAdditionCarry: (place: Place, digit: string) => {
		const { multiplicationSolution, multiplicationWork, finalSumWork } = get();
		const partialProductsSolved = multiplicationWork.rows.every(
			(r) => r.solved,
		);
		if (!partialProductsSolved) return;
		const displayWidth = Object.keys(finalSumWork.entries).length;
		const newFinalSumWork = enterFinalAdditionCarry(
			finalSumWork,
			multiplicationSolution,
			place,
			digit,
			displayWidth,
		);
		set({ finalSumWork: newFinalSumWork });
	},

	enterMultiplicationFinalSumOverflow: (digit: string) => {
		const {
			multiplicationSolution,
			multiplicationWork,
			multiplicationProblem,
			finalSumWork,
		} = get();
		const partialProductsSolved = multiplicationWork.rows.every(
			(r) => r.solved,
		);
		if (!partialProductsSolved) return;
		const newFinalSumWork = enterFinalSumOverflow(
			finalSumWork,
			multiplicationSolution,
			digit,
		);
		const overallSolved = partialProductsSolved && newFinalSumWork.solved;
		if (overallSolved && !multiplicationWork.solved) {
			recordAttemptInternal(multiplicationProblem.numPlaces, true);
		}
		set({
			finalSumWork: newFinalSumWork,
			multiplicationWork: { ...multiplicationWork, solved: overallSolved },
		});
	},
}));
