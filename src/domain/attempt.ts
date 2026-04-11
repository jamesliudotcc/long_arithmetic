export type Attempt = {
	readonly numPlaces: 1 | 2 | 3 | 4;
	readonly correct: boolean;
	readonly mode: "digit" | "visual" | "lattice";
	readonly operation:
		| "addition"
		| "subtraction"
		| "multiplication"
		| "circles";
	readonly timestamp: number; // epoch ms
};

export function createAttempt(
	numPlaces: 1 | 2 | 3 | 4,
	correct: boolean,
	mode: "digit" | "visual" | "lattice" = "digit",
	operation:
		| "addition"
		| "subtraction"
		| "multiplication"
		| "circles" = "addition",
	timestamp = Date.now(),
): Attempt {
	return { numPlaces, correct, mode, operation, timestamp };
}
