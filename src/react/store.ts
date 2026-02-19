import {
	type AdditionDifficulty,
	type AdditionProblem,
	generateAdditionProblem,
} from "@domain/addition";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type State = {
	problem: AdditionProblem;
	difficulty: AdditionDifficulty;
};

type Actions = {
	newProblem: () => void;
};

const DEFAULT_DIFFICULTY: AdditionDifficulty = { numPlaces: 3, numCarries: 2 };

export const useAdditionStore = create<State & Actions>()(
	devtools(
		(set, get) => ({
			difficulty: DEFAULT_DIFFICULTY,
			problem: generateAdditionProblem(DEFAULT_DIFFICULTY),
			newProblem: () =>
				set(
					{ problem: generateAdditionProblem(get().difficulty) },
					false,
					"newProblem",
				),
		}),
		{ name: "LongArithmetic" },
	),
);
