import type { AdditionDifficulty } from "@domain/addition";
import type { Attempt } from "@domain/attempt";
import type { StoragePort } from "@domain/ports";
import type { SubtractionDifficulty } from "@domain/subtraction";

const KEY_DIFFICULTY = "long-arithmetic:difficulty";
const KEY_SUBTRACTION_DIFFICULTY = "long-arithmetic:subtraction_difficulty";
const KEY_ATTEMPTS = "long-arithmetic:attempts";
const KEY_PERIOD_START = "long-arithmetic:periodStart";

export class LocalStorageAdapter implements StoragePort {
	getDifficulty(): AdditionDifficulty | null {
		try {
			const raw = localStorage.getItem(KEY_DIFFICULTY);
			if (raw === null) return null;
			return JSON.parse(raw) as AdditionDifficulty;
		} catch {
			return null;
		}
	}

	saveDifficulty(difficulty: AdditionDifficulty): void {
		localStorage.setItem(KEY_DIFFICULTY, JSON.stringify(difficulty));
	}

	getSubtractionDifficulty(): SubtractionDifficulty | null {
		try {
			const raw = localStorage.getItem(KEY_SUBTRACTION_DIFFICULTY);
			if (raw === null) return null;
			return JSON.parse(raw) as SubtractionDifficulty;
		} catch {
			return null;
		}
	}

	saveSubtractionDifficulty(difficulty: SubtractionDifficulty): void {
		localStorage.setItem(
			KEY_SUBTRACTION_DIFFICULTY,
			JSON.stringify(difficulty),
		);
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
		try {
			const raw = localStorage.getItem(KEY_PERIOD_START);
			if (raw === null) return null;
			return JSON.parse(raw) as number;
		} catch {
			return null;
		}
	}

	savePeriodStart(ts: number): void {
		localStorage.setItem(KEY_PERIOD_START, JSON.stringify(ts));
	}
}
