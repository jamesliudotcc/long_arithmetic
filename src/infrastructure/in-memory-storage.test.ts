import { describe, expect, it } from "bun:test";
import { InMemoryStorage } from "./in-memory-storage";

describe("InMemoryStorage", () => {
	it("getDifficulty returns null initially", () => {
		const storage = new InMemoryStorage();
		expect(storage.getDifficulty()).toBeNull();
	});

	it("saveDifficulty / getDifficulty round-trips", () => {
		const storage = new InMemoryStorage();
		const difficulty = { numPlaces: 2 as const, numCarries: 1 as const };
		storage.saveDifficulty(difficulty);
		expect(storage.getDifficulty()).toEqual(difficulty);
	});

	it("saveDifficulty overwrites previous value", () => {
		const storage = new InMemoryStorage();
		storage.saveDifficulty({ numPlaces: 1, numCarries: 0 });
		storage.saveDifficulty({ numPlaces: 4, numCarries: 3 });
		expect(storage.getDifficulty()).toEqual({ numPlaces: 4, numCarries: 3 });
	});

	it("each instance is independent", () => {
		const a = new InMemoryStorage();
		const b = new InMemoryStorage();
		a.saveDifficulty({ numPlaces: 3, numCarries: 2 });
		expect(b.getDifficulty()).toBeNull();
	});
});
