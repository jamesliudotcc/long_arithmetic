import type { AdditionDifficulty } from "./addition";

export interface StoragePort {
	getDifficulty(): AdditionDifficulty | null;
	saveDifficulty(difficulty: AdditionDifficulty): void;
}
