import type { AdditionDifficulty } from "@domain/addition";
import type { Attempt } from "@domain/attempt";
import type { StoragePort } from "@domain/ports";
import type { SubtractionDifficulty } from "@domain/subtraction";

export class InMemoryStorage implements StoragePort {
	private difficulty: AdditionDifficulty | null = null;
	private subtractionDifficultyValue: SubtractionDifficulty | null = null;
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
