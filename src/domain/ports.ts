import type { AdditionDifficulty } from "./addition";
import type { CirclesDifficulty } from "./circles";
import type { Attempt } from "./attempt";
import type { MultiplicationDifficulty } from "./multiplication";
import type { SubtractionDifficulty } from "./subtraction";

export interface StoragePort {
	getDifficulty(): AdditionDifficulty | null;
	saveDifficulty(difficulty: AdditionDifficulty): void;

	getSubtractionDifficulty(): SubtractionDifficulty | null;
	saveSubtractionDifficulty(difficulty: SubtractionDifficulty): void;

	getMultiplicationDifficulty(): MultiplicationDifficulty | null;
	saveMultiplicationDifficulty(difficulty: MultiplicationDifficulty): void;

	getCirclesDifficulty(): CirclesDifficulty | null;
	saveCirclesDifficulty(difficulty: CirclesDifficulty): void;

	getAttempts(): Attempt[];
	saveAttempt(attempt: Attempt): void;
	clearAttempts(): void;
	getPeriodStart(): number | null;
	savePeriodStart(ts: number): void;
}
