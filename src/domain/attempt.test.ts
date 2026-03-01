import { describe, expect, it } from "bun:test";
import { createAttempt } from "./attempt";

describe("createAttempt", () => {
	it("stores numPlaces, correct, mode, timestamp", () => {
		const attempt = createAttempt(2, true, "digit", 1000);
		expect(attempt.numPlaces).toBe(2);
		expect(attempt.correct).toBe(true);
		expect(attempt.mode).toBe("digit");
		expect(attempt.timestamp).toBe(1000);
	});

	it("defaults timestamp to approximately now", () => {
		const before = Date.now();
		const attempt = createAttempt(3, false);
		const after = Date.now();
		expect(attempt.timestamp).toBeGreaterThanOrEqual(before);
		expect(attempt.timestamp).toBeLessThanOrEqual(after);
	});

	it("accepts explicit timestamp", () => {
		const attempt = createAttempt(1, true, "visual", 42);
		expect(attempt.timestamp).toBe(42);
		expect(attempt.mode).toBe("visual");
	});

	it("defaults mode to digit", () => {
		const attempt = createAttempt(2, false);
		expect(attempt.mode).toBe("digit");
	});
});
