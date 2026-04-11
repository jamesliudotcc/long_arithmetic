import { describe, expect, it } from "bun:test";
import { createAttempt } from "./attempt";

describe("createAttempt", () => {
	it("stores numPlaces, correct, mode, operation, timestamp", () => {
		const attempt = createAttempt(2, true, "digit", "addition", 1000);
		expect(attempt.numPlaces).toBe(2);
		expect(attempt.correct).toBe(true);
		expect(attempt.mode).toBe("digit");
		expect(attempt.operation).toBe("addition");
		expect(attempt.timestamp).toBe(1000);
	});

	it("defaults timestamp to approximately now", () => {
		const before = Date.now();
		const attempt = createAttempt(3, false);
		const after = Date.now();
		expect(attempt.timestamp).toBeGreaterThanOrEqual(before);
		expect(attempt.timestamp).toBeLessThanOrEqual(after);
	});

	it("accepts explicit operation and timestamp", () => {
		const attempt = createAttempt(1, true, "visual", "subtraction", 42);
		expect(attempt.timestamp).toBe(42);
		expect(attempt.mode).toBe("visual");
		expect(attempt.operation).toBe("subtraction");
	});

	it("defaults mode to digit and operation to addition", () => {
		const attempt = createAttempt(2, false);
		expect(attempt.mode).toBe("digit");
		expect(attempt.operation).toBe("addition");
	});

	it("accepts circles attempts", () => {
		const attempt = createAttempt(1, true, "digit", "circles", 77);
		expect(attempt.operation).toBe("circles");
		expect(attempt.timestamp).toBe(77);
	});
});
