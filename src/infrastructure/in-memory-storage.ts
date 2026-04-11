import type { AdditionDifficulty } from "@domain/addition";
import type { Attempt } from "@domain/attempt";
import type { CirclesDifficulty } from "@domain/circles";
import type { MultiplicationDifficulty } from "@domain/multiplication";
import type { StoragePort } from "@domain/ports";
import type { SubtractionDifficulty } from "@domain/subtraction";

export class InMemoryStorage implements StoragePort {
	private difficulty: AdditionDifficulty | null = null;
	private subtractionDifficultyValue: SubtractionDifficulty | null = null;
	private multiplicationDifficultyValue: MultiplicationDifficulty | null = null;
	private circlesDifficultyValue: CirclesDifficulty | null = null;
	private attempts: Attempt[] = [];
	private periodStart: number | null = null;

	getDifficulty(): AdditionDifficulty | null {
		return this.difficulty;
	}

	saveDifficulty(difficulty: AdditionDifficulty): void {
		this.difficulty = difficulty;
	}

	getSubtractionDifficulty(): SubtractionDifficulty | null {
		return this.subtractionDifficultyValue;
	}

	saveSubtractionDifficulty(difficulty: SubtractionDifficulty): void {
		this.subtractionDifficultyValue = difficulty;
	}

	getMultiplicationDifficulty(): MultiplicationDifficulty | null {
		return this.multiplicationDifficultyValue;
	}

	saveMultiplicationDifficulty(difficulty: MultiplicationDifficulty): void {
		this.multiplicationDifficultyValue = difficulty;
	}

	getCirclesDifficulty(): CirclesDifficulty | null {
		return this.circlesDifficultyValue;
	}

	saveCirclesDifficulty(difficulty: CirclesDifficulty): void {
		this.circlesDifficultyValue = difficulty;
	}

	getAttempts(): Attempt[] {
		return [...this.attempts];
	}

	saveAttempt(attempt: Attempt): void {
		this.attempts.push(attempt);
	}

	clearAttempts(): void {
		this.attempts = [];
	}

	getPeriodStart(): number | null {
		return this.periodStart;
	}

	savePeriodStart(ts: number): void {
		this.periodStart = ts;
	}
}
