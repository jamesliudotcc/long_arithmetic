import type { AdditionDifficulty } from "@domain/addition";
import type { StoragePort } from "@domain/ports";

export class InMemoryStorage implements StoragePort {
	private difficulty: AdditionDifficulty | null = null;

	getDifficulty(): AdditionDifficulty | null {
		return this.difficulty;
	}

	saveDifficulty(difficulty: AdditionDifficulty): void {
		this.difficulty = difficulty;
	}
}
