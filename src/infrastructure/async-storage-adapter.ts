import type { AdditionDifficulty } from "@domain/addition";
import type { Attempt } from "@domain/attempt";
import type { CirclesDifficulty } from "@domain/circles";
import type { MultiplicationDifficulty } from "@domain/multiplication";
import type { StoragePort } from "@domain/ports";
import type { SubtractionDifficulty } from "@domain/subtraction";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_DIFFICULTY = "long-arithmetic:difficulty";
const KEY_SUBTRACTION_DIFFICULTY = "long-arithmetic:subtraction_difficulty";
const KEY_MULTIPLICATION_DIFFICULTY =
	"long-arithmetic:multiplication_difficulty";
const KEY_CIRCLES_DIFFICULTY = "long-arithmetic:circles_difficulty";
const KEY_ATTEMPTS = "long-arithmetic:attempts";
const KEY_PERIOD_START = "long-arithmetic:periodStart";

const ALL_KEYS = [
	KEY_DIFFICULTY,
	KEY_SUBTRACTION_DIFFICULTY,
	KEY_MULTIPLICATION_DIFFICULTY,
	KEY_CIRCLES_DIFFICULTY,
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

	private getCached<T>(key: string): T | null {
		try {
			const raw = this.cache.get(key);
			if (raw === undefined) return null;
			return JSON.parse(raw) as T;
		} catch {
			return null;
		}
	}

	private setCached<T>(key: string, value: T): void {
		const serialized = JSON.stringify(value);
		this.cache.set(key, serialized);
		AsyncStorage.setItem(key, serialized);
	}

	getDifficulty(): AdditionDifficulty | null {
		return this.getCached<AdditionDifficulty>(KEY_DIFFICULTY);
	}

	saveDifficulty(difficulty: AdditionDifficulty): void {
		this.setCached(KEY_DIFFICULTY, difficulty);
	}

	getSubtractionDifficulty(): SubtractionDifficulty | null {
		return this.getCached<SubtractionDifficulty>(KEY_SUBTRACTION_DIFFICULTY);
	}

	saveSubtractionDifficulty(difficulty: SubtractionDifficulty): void {
		this.setCached(KEY_SUBTRACTION_DIFFICULTY, difficulty);
	}

	getMultiplicationDifficulty(): MultiplicationDifficulty | null {
		return this.getCached<MultiplicationDifficulty>(
			KEY_MULTIPLICATION_DIFFICULTY,
		);
	}

	saveMultiplicationDifficulty(difficulty: MultiplicationDifficulty): void {
		this.setCached(KEY_MULTIPLICATION_DIFFICULTY, difficulty);
	}

	getCirclesDifficulty(): CirclesDifficulty | null {
		return this.getCached<CirclesDifficulty>(KEY_CIRCLES_DIFFICULTY);
	}

	saveCirclesDifficulty(difficulty: CirclesDifficulty): void {
		this.setCached(KEY_CIRCLES_DIFFICULTY, difficulty);
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
		this.setCached(KEY_ATTEMPTS, existing);
	}

	clearAttempts(): void {
		this.cache.delete(KEY_ATTEMPTS);
		AsyncStorage.removeItem(KEY_ATTEMPTS);
	}

	getPeriodStart(): number | null {
		return this.getCached<number>(KEY_PERIOD_START);
	}

	savePeriodStart(ts: number): void {
		this.setCached(KEY_PERIOD_START, ts);
	}
}
