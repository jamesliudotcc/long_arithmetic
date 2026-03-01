export type Attempt = {
	readonly numPlaces: 1 | 2 | 3 | 4;
	readonly correct: boolean;
	readonly mode: "digit" | "visual";
	readonly timestamp: number; // epoch ms
};

export function createAttempt(
	numPlaces: 1 | 2 | 3 | 4,
	correct: boolean,
	mode: "digit" | "visual" = "digit",
	timestamp = Date.now(),
): Attempt {
	return { numPlaces, correct, mode, timestamp };
}
