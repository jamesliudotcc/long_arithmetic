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

	describe("attempts", () => {
		it("getAttempts returns empty array initially", () => {
			const storage = new InMemoryStorage();
			expect(storage.getAttempts()).toEqual([]);
		});

		it("saveAttempt / getAttempts round-trips", () => {
			const storage = new InMemoryStorage();
			const attempt = { numPlaces: 2 as const, correct: true, timestamp: 1000 };
			storage.saveAttempt(attempt);
			expect(storage.getAttempts()).toEqual([attempt]);
		});

		it("accumulates multiple attempts", () => {
			const storage = new InMemoryStorage();
			storage.saveAttempt({
				numPlaces: 1 as const,
				correct: true,
				timestamp: 1,
			});
			storage.saveAttempt({
				numPlaces: 2 as const,
				correct: false,
				timestamp: 2,
			});
			expect(storage.getAttempts()).toHaveLength(2);
		});

		it("getAttempts returns a copy (not the internal array)", () => {
			const storage = new InMemoryStorage();
			storage.saveAttempt({
				numPlaces: 1 as const,
				correct: true,
				timestamp: 1,
			});
			const first = storage.getAttempts();
			first.push({ numPlaces: 3 as const, correct: false, timestamp: 99 });
			expect(storage.getAttempts()).toHaveLength(1);
		});

		it("clearAttempts removes all attempts", () => {
			const storage = new InMemoryStorage();
			storage.saveAttempt({
				numPlaces: 1 as const,
				correct: true,
				timestamp: 1,
			});
			storage.clearAttempts();
			expect(storage.getAttempts()).toEqual([]);
		});
	});

	describe("periodStart", () => {
		it("getPeriodStart returns null initially", () => {
			const storage = new InMemoryStorage();
			expect(storage.getPeriodStart()).toBeNull();
		});

		it("savePeriodStart / getPeriodStart round-trips", () => {
			const storage = new InMemoryStorage();
			storage.savePeriodStart(5000);
			expect(storage.getPeriodStart()).toBe(5000);
		});

		it("savePeriodStart overwrites previous value", () => {
			const storage = new InMemoryStorage();
			storage.savePeriodStart(1000);
			storage.savePeriodStart(2000);
			expect(storage.getPeriodStart()).toBe(2000);
		});
	});
});
