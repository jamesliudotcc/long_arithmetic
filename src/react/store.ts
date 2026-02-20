import {
	type AdditionDifficulty,
	type AdditionProblem,
	type AdditionSolution,
	PLACES,
	type Place,
	computeSolution,
	generateAdditionProblem,
} from "@domain/addition";
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
};

type Actions = {
	newProblem: () => void;
	enterAnswer: (place: Place, digit: string) => void;
	enterCarry: (place: Place, digit: string) => void;
	enterFinalCarry: (digit: string) => void;
};

const DEFAULT_DIFFICULTY: AdditionDifficulty = { numPlaces: 3, numCarries: 2 };

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
	const carryCorrect = col.carryOut === 0 || entry.carryStatus === "correct";
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

const initialProblem = generateAdditionProblem(DEFAULT_DIFFICULTY);

export const useAdditionStore = create<State & Actions>()(
	devtools(
		(set, get) => ({
			difficulty: DEFAULT_DIFFICULTY,
			problem: initialProblem,
			solution: computeSolution(initialProblem),
			work: initialWork(),

			newProblem: () => {
				const problem = generateAdditionProblem(get().difficulty);
				set(
					{
						problem,
						solution: computeSolution(problem),
						work: initialWork(),
					},
					false,
					"newProblem",
				);
			},

			enterAnswer: (place: Place, digit: string) => {
				const { solution, work } = get();
				const { problem } = get();
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

				set(
					{
						work: {
							...work,
							entries: updatedEntries,
							...advance,
						},
					},
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

				set(
					{
						work: {
							...work,
							entries: updatedEntries,
							...advance,
						},
					},
					false,
					"enterCarry",
				);
			},

			enterFinalCarry: (digit: string) => {
				const { solution, work } = get();
				const correct = digit === String(solution.finalCarryOut);
				const finalCarryStatus: CellStatus = correct ? "correct" : "incorrect";
				const solved = correct;
				set(
					{
						work: {
							...work,
							finalCarry: digit,
							finalCarryStatus,
							solved,
						},
					},
					false,
					"enterFinalCarry",
				);
			},
		}),
		{ name: "LongArithmetic" },
	),
);
