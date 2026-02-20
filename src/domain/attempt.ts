export type Attempt = {
	readonly numPlaces: 1 | 2 | 3 | 4;
	readonly correct: boolean;
	readonly timestamp: number; // epoch ms
};

export function createAttempt(
	numPlaces: 1 | 2 | 3 | 4,
	correct: boolean,
	timestamp = Date.now(),
): Attempt {
	return { numPlaces, correct, timestamp };
}
