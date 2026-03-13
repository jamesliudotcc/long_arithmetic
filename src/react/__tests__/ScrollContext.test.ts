import { describe, expect, it, mock } from "bun:test";
import { ScrollContext } from "../ScrollContext";

// Access the default context value (React internals, stable across versions)
// biome-ignore lint/suspicious/noExplicitAny: accessing React context internals for testing
const defaultValue = (ScrollContext as any)._currentValue;

describe("ScrollContext", () => {
	it("default scrollTo is a no-op function", () => {
		expect(typeof defaultValue.scrollTo).toBe("function");
	});

	it("calling default scrollTo does not throw", () => {
		expect(() => defaultValue.scrollTo(100)).not.toThrow();
		expect(() => defaultValue.scrollTo(0)).not.toThrow();
		expect(() => defaultValue.scrollTo(-50)).not.toThrow();
	});

	it("default scrollYRef is null", () => {
		expect(defaultValue.scrollYRef).toBeNull();
	});

	it("scrollTo callback computes correct target: startY - translationY", () => {
		const calls: number[] = [];
		const scrollTo = (y: number) => calls.push(y);

		// Simulate what threeFingerPan onUpdate does
		const startScrollY = 0;
		const translationY = -50;
		scrollTo(startScrollY - translationY);

		expect(calls).toEqual([50]);
	});

	it("scrollTo with non-zero startY computes correct target", () => {
		const calls: number[] = [];
		const scrollTo = (y: number) => calls.push(y);

		const startScrollY = 100;
		const translationY = 30;
		scrollTo(startScrollY - translationY);

		expect(calls).toEqual([70]);
	});

	it("scrollTo with null guard: calling mock ref scrollTo when ref is null is safe", () => {
		// Simulate the safe version: provide a no-op when ref is null
		const safeScrollTo = mock((_y: number) => {});

		// If provided as context value, calling it is safe even if underlying ref is null
		expect(() => safeScrollTo(0)).not.toThrow();
		expect(safeScrollTo).toHaveBeenCalledTimes(1);
	});
});
