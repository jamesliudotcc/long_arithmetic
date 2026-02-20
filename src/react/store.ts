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
import { InMemoryStorage } from "@infrastructure/in-memory-storage";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type CellStatus = "idle" | "correct" | "incorrect";

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

type State = {
	problem: AdditionProblem;
	difficulty: AdditionDifficulty;
	solution: AdditionSolution;
	work: WorkState;
	attempts: Attempt[];
	periodStart: number;
};

type Actions = {
	newProblem: () => void;
	setDifficulty: (difficulty: AdditionDifficulty) => void;
	enterAnswer: (place: Place, digit: string) => void;
	enterCarry: (place: Place, digit: string) => void;
	enterFinalCarry: (digit: string) => void;
	resetPeriod: () => void;
};

const DEFAULT_DIFFICULTY: AdditionDifficulty = { numPlaces: 3, numCarries: 2 };

let _storage: StoragePort = new InMemoryStorage();

function midnightToday(): number {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d.getTime();
}

export function initializeStorage(storage: StoragePort): void {
	_storage = storage;

	const savedDifficulty = storage.getDifficulty();
	const attempts = storage.getAttempts();
	const savedPeriodStart = storage.getPeriodStart();
	const periodStart =
		savedPeriodStart !== null ? savedPeriodStart : midnightToday();
	if (savedPeriodStart === null) {
		storage.savePeriodStart(periodStart);
	}

	if (savedDifficulty) {
		const problem = generateAdditionProblem(savedDifficulty);
		useAdditionStore.setState({
			difficulty: savedDifficulty,
			problem,
			solution: computeSolution(problem),
			work: initialWork(),
			attempts,
			periodStart,
		});
	} else {
		useAdditionStore.setState({ attempts, periodStart });
	}
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

export const useAdditionStore = create<State & Actions>()(
	devtools(
		(set, get) => ({
			difficulty: DEFAULT_DIFFICULTY,
			problem: initialProblem,
			solution: computeSolution(initialProblem),
			work: initialWork(),
			attempts: [],
			periodStart: midnightToday(),

			newProblem: () => {
				const { work, problem } = get();
				if (!work.solved) {
					recordAttemptInternal(problem.numPlaces, false);
				}
				const newProb = generateAdditionProblem(get().difficulty);
				set(
					{
						problem: newProb,
						solution: computeSolution(newProb),
						work: initialWork(),
					},
					false,
					"newProblem",
				);
			},

			setDifficulty: (difficulty: AdditionDifficulty) => {
				const { work, problem } = get();
				if (!work.solved) {
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
		}),
		{ name: "LongArithmetic" },
	),
);
