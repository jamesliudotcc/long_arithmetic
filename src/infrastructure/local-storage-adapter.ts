import type { AdditionDifficulty } from "@domain/addition";
import type { StoragePort } from "@domain/ports";

const KEY = "long-arithmetic:difficulty";

export class LocalStorageAdapter implements StoragePort {
	getDifficulty(): AdditionDifficulty | null {
		try {
			const raw = localStorage.getItem(KEY);
			if (raw === null) return null;
			return JSON.parse(raw) as AdditionDifficulty;
		} catch {
			return null;
		}
	}

	saveDifficulty(difficulty: AdditionDifficulty): void {
		localStorage.setItem(KEY, JSON.stringify(difficulty));
	}
}
