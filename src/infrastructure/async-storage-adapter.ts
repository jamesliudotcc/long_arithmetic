import type { AdditionDifficulty } from "@domain/addition";
import type { Attempt } from "@domain/attempt";
import type { StoragePort } from "@domain/ports";
import type { SubtractionDifficulty } from "@domain/subtraction";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_DIFFICULTY = "long-arithmetic:difficulty";
const KEY_SUBTRACTION_DIFFICULTY = "long-arithmetic:subtraction_difficulty";
const KEY_ATTEMPTS = "long-arithmetic:attempts";
const KEY_PERIOD_START = "long-arithmetic:periodStart";

const ALL_KEYS = [
	KEY_DIFFICULTY,
	KEY_SUBTRACTION_DIFFICULTY,
	KEY_ATTEMPTS,
	KEY_PERIOD_START,
] as const;

export class AsyncStorageAdapter implements StoragePort {
	private cache: Map<string, string>;

	private constructor(cache: Map<string, string>) {
		this.cache = cache;
	}

	static async create(): Promise<AsyncStorageAdapter> {
		const pairs = await AsyncStorage.multiGet([...ALL_KEYS]);
		const cache = new Map<string, string>();
		for (const [key, value] of pairs) {
			if (value !== null) {
				cache.set(key, value);
			}
		}
		return new AsyncStorageAdapter(cache);
	}

	getDifficulty(): AdditionDifficulty | null {
		try {
			const raw = this.cache.get(KEY_DIFFICULTY);
			if (raw === undefined) return null;
			return JSON.parse(raw) as AdditionDifficulty;
		} catch {
			return null;
		}
	}

	saveDifficulty(difficulty: AdditionDifficulty): void {
		const value = JSON.stringify(difficulty);
		this.cache.set(KEY_DIFFICULTY, value);
		AsyncStorage.setItem(KEY_DIFFICULTY, value);
	}

	getSubtractionDifficulty(): SubtractionDifficulty | null {
		try {
			const raw = this.cache.get(KEY_SUBTRACTION_DIFFICULTY);
			if (raw === undefined) return null;
			return JSON.parse(raw) as SubtractionDifficulty;
		} catch {
			return null;
		}
	}

	saveSubtractionDifficulty(difficulty: SubtractionDifficulty): void {
		const value = JSON.stringify(difficulty);
		this.cache.set(KEY_SUBTRACTION_DIFFICULTY, value);
		AsyncStorage.setItem(KEY_SUBTRACTION_DIFFICULTY, value);
	}

	getAttempts(): Attempt[] {
		try {
			const raw = this.cache.get(KEY_ATTEMPTS);
			if (raw === undefined) return [];
			return JSON.parse(raw) as Attempt[];
		} catch {
			return [];
		}
	}

	saveAttempt(attempt: Attempt): void {
		const existing = this.getAttempts();
		existing.push(attempt);
		const value = JSON.stringify(existing);
		this.cache.set(KEY_ATTEMPTS, value);
		AsyncStorage.setItem(KEY_ATTEMPTS, value);
	}

	clearAttempts(): void {
		this.cache.delete(KEY_ATTEMPTS);
		AsyncStorage.removeItem(KEY_ATTEMPTS);
	}

	getPeriodStart(): number | null {
		try {
			const raw = this.cache.get(KEY_PERIOD_START);
			if (raw === undefined) return null;
			return JSON.parse(raw) as number;
		} catch {
			return null;
		}
	}

	savePeriodStart(ts: number): void {
		const value = JSON.stringify(ts);
		this.cache.set(KEY_PERIOD_START, value);
		AsyncStorage.setItem(KEY_PERIOD_START, value);
	}
}
