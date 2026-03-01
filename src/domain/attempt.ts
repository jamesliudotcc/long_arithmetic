export type Attempt = {
	readonly numPlaces: 1 | 2 | 3 | 4;
	readonly correct: boolean;
	readonly mode: "digit" | "visual";
	readonly operation: "addition" | "subtraction";
	readonly timestamp: number; // epoch ms
};

export function createAttempt(
	numPlaces: 1 | 2 | 3 | 4,
	correct: boolean,
	mode: "digit" | "visual" = "digit",
	operation: "addition" | "subtraction" = "addition",
	timestamp = Date.now(),
): Attempt {
	return { numPlaces, correct, mode, operation, timestamp };
}
