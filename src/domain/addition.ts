export type Place = "ones_pl" | "tens_pl" | "hundreds_pl" | "thousands_pl";
export const PLACES: Place[] = [
	"ones_pl",
	"tens_pl",
	"hundreds_pl",
	"thousands_pl",
];

export type PlaceValues = {
	ones_pl: number;
	tens_pl: number;
	hundreds_pl: number;
	thousands_pl: number;
};

export type AdditionProblem = {
	addend1: PlaceValues;
	addend2: PlaceValues;
	numPlaces: 1 | 2 | 3 | 4;
};

export type AdditionDifficulty = {
	numPlaces: 1 | 2 | 3 | 4;
	numCarries: 0 | 1 | 2 | 3 | 4;
};

export function decompose(n: number): PlaceValues {
	return {
		ones_pl: n % 10,
		tens_pl: Math.floor(n / 10) % 10,
		hundreds_pl: Math.floor(n / 100) % 10,
		thousands_pl: Math.floor(n / 1000) % 10,
	};
}

export function toNumber(pv: PlaceValues): number {
	return (
		pv.ones_pl + pv.tens_pl * 10 + pv.hundreds_pl * 100 + pv.thousands_pl * 1000
	);
}

function randInt(min: number, max: number, random: () => number): number {
	return Math.floor(random() * (max - min + 1)) + min;
}

export type ColumnSolution = {
	carryIn: number; // 0 or 1
	rawSum: number; // d1 + d2 + carryIn
	answerDigit: number; // rawSum % 10
	carryOut: number; // Math.floor(rawSum / 10)
};

export type AdditionSolution = {
	columns: Record<Place, ColumnSolution>;
	finalCarryOut: number; // carry out of the leading active column (0 or 1)
};

export function computeSolution(problem: AdditionProblem): AdditionSolution {
	const zero: ColumnSolution = {
		carryIn: 0,
		rawSum: 0,
		answerDigit: 0,
		carryOut: 0,
	};
	const columns: Record<Place, ColumnSolution> = {
		ones_pl: { ...zero },
		tens_pl: { ...zero },
		hundreds_pl: { ...zero },
		thousands_pl: { ...zero },
	};
	let carry = 0;
	for (let i = 0; i < problem.numPlaces; i++) {
		const place = PLACES[i];
		const raw = problem.addend1[place] + problem.addend2[place] + carry;
		columns[place] = {
			carryIn: carry,
			rawSum: raw,
			answerDigit: raw % 10,
			carryOut: Math.floor(raw / 10),
		};
		carry = columns[place].carryOut;
	}
	return { columns, finalCarryOut: carry };
}

export function generateAdditionProblem(
	difficulty: AdditionDifficulty,
	random: () => number = Math.random,
): AdditionProblem {
	const { numPlaces, numCarries } = difficulty;
	if (numCarries > numPlaces) {
		throw new Error(
			`numCarries (${numCarries}) must not exceed numPlaces (${numPlaces})`,
		);
	}

	const pv1: PlaceValues = {
		ones_pl: 0,
		tens_pl: 0,
		hundreds_pl: 0,
		thousands_pl: 0,
	};
	const pv2: PlaceValues = {
		ones_pl: 0,
		tens_pl: 0,
		hundreds_pl: 0,
		thousands_pl: 0,
	};

	for (let i = 0; i < numPlaces; i++) {
		const place = PLACES[i];
		const isLeading = i === numPlaces - 1;
		const forceCarry = i < numCarries;

		let d1: number;
		let d2: number;

		if (forceCarry) {
			d1 = randInt(1, 9, random);
			const d2Min = isLeading ? Math.max(1, 10 - d1) : Math.max(0, 10 - d1);
			d2 = randInt(d2Min, 9, random);
		} else if (isLeading) {
			d1 = randInt(1, 8, random);
			d2 = randInt(1, 9 - d1, random);
		} else {
			d1 = randInt(0, 9, random);
			d2 = randInt(0, 9 - d1, random);
		}

		pv1[place] = d1;
		pv2[place] = d2;
	}

	return { addend1: pv1, addend2: pv2, numPlaces };
}
