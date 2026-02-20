import type { AdditionDifficulty } from "./addition";
import type { Attempt } from "./attempt";

export interface StoragePort {
	getDifficulty(): AdditionDifficulty | null;
	saveDifficulty(difficulty: AdditionDifficulty): void;

	getAttempts(): Attempt[];
	saveAttempt(attempt: Attempt): void;
	clearAttempts(): void;
	getPeriodStart(): number | null;
	savePeriodStart(ts: number): void;
}
