import type { AdditionDifficulty } from "./addition";
import type { Attempt } from "./attempt";
import type { SubtractionDifficulty } from "./subtraction";

export interface StoragePort {
	getDifficulty(): AdditionDifficulty | null;
	saveDifficulty(difficulty: AdditionDifficulty): void;

	getSubtractionDifficulty(): SubtractionDifficulty | null;
	saveSubtractionDifficulty(difficulty: SubtractionDifficulty): void;

	getAttempts(): Attempt[];
	saveAttempt(attempt: Attempt): void;
	clearAttempts(): void;
	getPeriodStart(): number | null;
	savePeriodStart(ts: number): void;
}
