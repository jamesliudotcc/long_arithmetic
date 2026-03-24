import type { AdditionDifficulty } from "@domain/addition";
import type { Attempt } from "@domain/attempt";
import type { MultiplicationDifficulty } from "@domain/multiplication";
import type { StoragePort } from "@domain/ports";
import type { SubtractionDifficulty } from "@domain/subtraction";

const KEY_DIFFICULTY = "long-arithmetic:difficulty";
const KEY_SUBTRACTION_DIFFICULTY = "long-arithmetic:subtraction_difficulty";
const KEY_MULTIPLICATION_DIFFICULTY =
	"long-arithmetic:multiplication_difficulty";
const KEY_ATTEMPTS = "long-arithmetic:attempts";
const KEY_PERIOD_START = "long-arithmetic:periodStart";

export class LocalStorageAdapter implements StoragePort {
	private getItem<T>(key: string): T | null {
		try {
			const raw = localStorage.getItem(key);
			if (raw === null) return null;
			return JSON.parse(raw) as T;
		} catch {
			return null;
		}
	}

	private setItem<T>(key: string, value: T): void {
		localStorage.setItem(key, JSON.stringify(value));
	}

	getDifficulty(): AdditionDifficulty | null {
		return this.getItem<AdditionDifficulty>(KEY_DIFFICULTY);
	}

	saveDifficulty(difficulty: AdditionDifficulty): void {
		this.setItem(KEY_DIFFICULTY, difficulty);
	}

	getSubtractionDifficulty(): SubtractionDifficulty | null {
		return this.getItem<SubtractionDifficulty>(KEY_SUBTRACTION_DIFFICULTY);
	}

	saveSubtractionDifficulty(difficulty: SubtractionDifficulty): void {
		this.setItem(KEY_SUBTRACTION_DIFFICULTY, difficulty);
	}

	getMultiplicationDifficulty(): MultiplicationDifficulty | null {
		return this.getItem<MultiplicationDifficulty>(
			KEY_MULTIPLICATION_DIFFICULTY,
		);
	}

	saveMultiplicationDifficulty(difficulty: MultiplicationDifficulty): void {
		this.setItem(KEY_MULTIPLICATION_DIFFICULTY, difficulty);
	}

	getAttempts(): Attempt[] {
		try {
			const raw = localStorage.getItem(KEY_ATTEMPTS);
			if (raw === null) return [];
			return JSON.parse(raw) as Attempt[];
		} catch {
			return [];
		}
	}

	saveAttempt(attempt: Attempt): void {
		const existing = this.getAttempts();
		existing.push(attempt);
		localStorage.setItem(KEY_ATTEMPTS, JSON.stringify(existing));
	}

	clearAttempts(): void {
		localStorage.removeItem(KEY_ATTEMPTS);
	}

	getPeriodStart(): number | null {
		return this.getItem<number>(KEY_PERIOD_START);
	}

	savePeriodStart(ts: number): void {
		this.setItem(KEY_PERIOD_START, ts);
	}
}
