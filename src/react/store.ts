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
import { InMemoryStorage } from "@infrastructure/in-memory-storage";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

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

type State = {
	problem: AdditionProblem;
	difficulty: AdditionDifficulty;
	solution: AdditionSolution;
	work: WorkState;
	visualWork: VisualWorkState;
	mode: Mode;
	attempts: Attempt[];
	periodStart: number;
	operation: "addition" | "subtraction";
	subtractionDifficulty: SubtractionDifficulty;
	subtractionProblem: SubtractionProblem;
	subtractionSolution: SubtractionSolution;
	subtractionWork: SubtractionWorkState;
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
	setOperation: (op: "addition" | "subtraction") => void;
	setSubtractionDifficulty: (difficulty: SubtractionDifficulty) => void;
	enterSubtractionAnswer: (place: Place, digit: string) => void;
	enterSubtractionBorrow: (place: Place, digit: string) => void;
	enterSubtractionEffectiveValue: (place: Place, digit: string) => void;
};

const DEFAULT_DIFFICULTY: AdditionDifficulty = { numPlaces: 3, numCarries: 2 };
const DEFAULT_SUBTRACTION_DIFFICULTY: SubtractionDifficulty = {
	numPlaces: 3,
	numBorrows: 2,
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
	const attempt = createAttempt(numPlaces, correct);
	_storage.saveAttempt(attempt);
	useAdditionStore.setState(
		(s) => ({ attempts: [...s.attempts, attempt] }),
		false,
		"recordAttempt" as string,
	);
}

const initialProblem = generateAdditionProblem(DEFAULT_DIFFICULTY);
const initialSubtractionProblem = generateSubtractionProblem(
	DEFAULT_SUBTRACTION_DIFFICULTY,
);

export const useAdditionStore = create<State & Actions>()(
	devtools(
		(set, get) => ({
			difficulty: DEFAULT_DIFFICULTY,
			problem: initialProblem,
			solution: computeSolution(initialProblem),
			work: initialWork(),
			visualWork: initialVisualWork(initialProblem),
			mode: "digit" as Mode,
			attempts: [],
			periodStart: midnightToday(),
			operation: "addition" as "addition" | "subtraction",
			subtractionDifficulty: DEFAULT_SUBTRACTION_DIFFICULTY,
			subtractionProblem: initialSubtractionProblem,
			subtractionSolution: computeSubtractionSolution(
				initialSubtractionProblem,
			),
			subtractionWork: initialSubtractionWork(),

			newProblem: () => {
				const {
					operation,
					work,
					visualWork,
					problem,
					subtractionWork,
					subtractionProblem,
					difficulty,
					subtractionDifficulty,
					mode,
				} = get();

				if (operation === "subtraction") {
					if (!subtractionWork.solved) {
						recordAttemptInternal(subtractionProblem.numPlaces, false);
					}
					const newProb = generateSubtractionProblem(subtractionDifficulty);
					set(
						{
							subtractionProblem: newProb,
							subtractionSolution: computeSubtractionSolution(newProb),
							subtractionWork: initialSubtractionWork(),
						},
						false,
						"newProblem",
					);
				} else {
					const activeModeSolved =
						mode === "visual" ? visualWork.solved : work.solved;
					if (!activeModeSolved) {
						recordAttemptInternal(problem.numPlaces, false);
					}
					const newProb = generateAdditionProblem(difficulty);
					set(
						{
							problem: newProb,
							solution: computeSolution(newProb),
							work: initialWork(),
							visualWork: initialVisualWork(newProb),
						},
						false,
						"newProblem",
					);
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
				set(
					{
						difficulty: clamped,
						problem: newProb,
						solution: computeSolution(newProb),
						work: initialWork(),
						visualWork: initialVisualWork(newProb),
					},
					false,
					"setDifficulty",
				);
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

				set(
					{ work: { ...work, entries: updatedEntries, ...advance } },
					false,
					"enterAnswer",
				);
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

				set(
					{ work: { ...work, entries: updatedEntries, ...advance } },
					false,
					"enterCarry",
				);
			},

			enterFinalCarry: (digit: string) => {
				const { solution, work, problem } = get();
				const correct = digit === String(solution.finalCarryOut);
				const finalCarryStatus: CellStatus = correct ? "correct" : "incorrect";

				if (correct) {
					recordAttemptInternal(problem.numPlaces, true);
				}

				set(
					{
						work: {
							...work,
							finalCarry: digit,
							finalCarryStatus,
							solved: correct,
						},
					},
					false,
					"enterFinalCarry",
				);
			},

			resetPeriod: () => {
				const ts = Date.now();
				_storage.savePeriodStart(ts);
				set({ periodStart: ts }, false, "resetPeriod");
			},

			setMode: (mode: Mode) => {
				set({ mode }, false, "setMode");
			},

			moveVisualDisk: (place: Place, from: VisualZone) => {
				const { visualWork, problem } = get();
				const newWork = applyMoveDisk(
					visualWork,
					place,
					from,
					problem.numPlaces,
				);
				if (newWork.solved && !visualWork.solved) {
					recordAttemptInternal(problem.numPlaces, true);
				}
				set({ visualWork: newWork }, false, "moveVisualDisk");
			},

			carryVisual: (place: Place, zone: VisualZone) => {
				const { visualWork, problem } = get();
				const newWork = applyCarryOut(
					visualWork,
					place,
					zone,
					problem.numPlaces,
				);
				if (newWork.solved && !visualWork.solved) {
					recordAttemptInternal(problem.numPlaces, true);
				}
				set({ visualWork: newWork }, false, "carryVisual");
			},

			setOperation: (op: "addition" | "subtraction") => {
				const {
					operation,
					work,
					visualWork,
					problem,
					subtractionWork,
					subtractionProblem,
					mode,
				} = get();
				if (operation === op) return;

				if (operation === "addition") {
					const activeModeSolved =
						mode === "visual" ? visualWork.solved : work.solved;
					if (!activeModeSolved) {
						recordAttemptInternal(problem.numPlaces, false);
					}
				} else {
					if (!subtractionWork.solved) {
						recordAttemptInternal(subtractionProblem.numPlaces, false);
					}
				}

				set({ operation: op }, false, "setOperation");
			},

			setSubtractionDifficulty: (difficulty: SubtractionDifficulty) => {
				const { subtractionWork, subtractionProblem } = get();
				if (!subtractionWork.solved) {
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
				set(
					{
						subtractionDifficulty: clamped,
						subtractionProblem: newProb,
						subtractionSolution: computeSubtractionSolution(newProb),
						subtractionWork: initialSubtractionWork(),
					},
					false,
					"setSubtractionDifficulty",
				);
			},

			enterSubtractionAnswer: (place: Place, digit: string) => {
				const { subtractionSolution, subtractionWork, subtractionProblem } =
					get();
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

				set(
					{
						subtractionWork: {
							...subtractionWork,
							entries: updatedEntries,
							...advance,
						},
					},
					false,
					"enterSubtractionAnswer",
				);
			},

			enterSubtractionBorrow: (place: Place, digit: string) => {
				const { subtractionSolution, subtractionWork, subtractionProblem } =
					get();
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

				set(
					{
						subtractionWork: {
							...subtractionWork,
							entries: updatedEntries,
							...advance,
						},
					},
					false,
					"enterSubtractionBorrow",
				);
			},

			enterSubtractionEffectiveValue: (place: Place, digit: string) => {
				const { subtractionSolution, subtractionWork, subtractionProblem } =
					get();
				const index = PLACES.indexOf(place);
				if (index !== subtractionWork.unlockedUpTo) return;

				const col = subtractionSolution.columns[place];
				const correct = digit === String(col.effectiveTop + 10);
				const effectiveValueStatus: CellStatus = correct
					? "correct"
					: "incorrect";

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

				set(
					{
						subtractionWork: {
							...subtractionWork,
							entries: updatedEntries,
							...advance,
						},
					},
					false,
					"enterSubtractionEffectiveValue",
				);
			},
		}),
		{ name: "LongArithmetic" },
	),
);
