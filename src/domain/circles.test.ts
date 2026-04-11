import { describe, expect, it } from "bun:test";
import {
	DEFAULT_CIRCLES_DIFFICULTY,
	computeCirclesSolution,
	generateCirclesProblem,
	validateCirclesDifficulty,
} from "./circles";

describe("validateCirclesDifficulty", () => {
	it("clamps radius range and restores prompt kinds when empty", () => {
		expect(
			validateCirclesDifficulty({
				minRadiusCm: 4,
				maxRadiusCm: 1,
				enabledPromptKinds: [],
			}),
		).toEqual({
			minRadiusCm: 4,
			maxRadiusCm: 4,
			enabledPromptKinds: DEFAULT_CIRCLES_DIFFICULTY.enabledPromptKinds,
		});
	});
});

describe("generateCirclesProblem", () => {
	it("generates only the first two prompt kinds by default", () => {
		for (let i = 0; i < 100; i++) {
			const problem = generateCirclesProblem();
			expect(
				problem.kind === "identify_segment" ||
					problem.kind === "derive_missing_measure",
			).toBe(true);
		}
	});

	it("keeps generated radii in the configured range", () => {
		for (let i = 0; i < 100; i++) {
			const problem = generateCirclesProblem();
			expect(problem.radiusCm).toBeGreaterThanOrEqual(1);
			expect(problem.radiusCm).toBeLessThanOrEqual(4);
			expect(problem.diameterCm).toBe(problem.radiusCm * 2);
		}
	});
});

describe("computeCirclesSolution", () => {
	it("returns the correct answer for identify_segment", () => {
		expect(
			computeCirclesSolution({
				kind: "identify_segment",
				radiusCm: 3,
				diameterCm: 6,
				showCenterPoint: false,
				segmentKind: "diameter",
			}),
		).toEqual({
			kind: "identify_segment",
			segmentKind: "diameter",
		});
	});

	it("derives the missing measurement from the known one", () => {
		expect(
			computeCirclesSolution({
				kind: "derive_missing_measure",
				radiusCm: 4,
				diameterCm: 8,
				showCenterPoint: false,
				givenKind: "radius",
				givenLengthCm: 4,
				missingKind: "diameter",
			}),
		).toEqual({
			kind: "derive_missing_measure",
			givenKind: "radius",
			givenLengthCm: 4,
			missingKind: "diameter",
			missingLengthCm: 8,
		});
	});

	it("supports the future ruler variant in the domain", () => {
		expect(
			computeCirclesSolution({
				kind: "measure_with_ruler",
				radiusCm: 2,
				diameterCm: 4,
				showCenterPoint: true,
				measuredKind: "diameter",
			}),
		).toEqual({
			kind: "measure_with_ruler",
			radiusCm: 2,
			diameterCm: 4,
		});
	});
});
