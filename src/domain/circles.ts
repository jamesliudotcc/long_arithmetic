export type CircleMeasureKind = "radius" | "diameter";
export type CirclesPromptKind =
	| "identify_segment"
	| "derive_missing_measure"
	| "measure_with_ruler";
export type ActiveCirclesPromptKind =
	| "identify_segment"
	| "derive_missing_measure";

export type CirclesDifficulty = {
	readonly minRadiusCm: 1 | 2 | 3 | 4;
	readonly maxRadiusCm: 1 | 2 | 3 | 4;
	readonly enabledPromptKinds: readonly ActiveCirclesPromptKind[];
};

type CirclesProblemBase = {
	readonly radiusCm: number;
	readonly diameterCm: number;
	readonly showCenterPoint: boolean;
};

export type IdentifySegmentProblem = CirclesProblemBase & {
	readonly kind: "identify_segment";
	readonly segmentKind: CircleMeasureKind;
};

export type DeriveMissingMeasureProblem = CirclesProblemBase & {
	readonly kind: "derive_missing_measure";
	readonly givenKind: CircleMeasureKind;
	readonly givenLengthCm: number;
	readonly missingKind: CircleMeasureKind;
};

export type MeasureWithRulerProblem = CirclesProblemBase & {
	readonly kind: "measure_with_ruler";
	readonly measuredKind: CircleMeasureKind;
};

export type CirclesProblem =
	| IdentifySegmentProblem
	| DeriveMissingMeasureProblem
	| MeasureWithRulerProblem;

export type IdentifySegmentSolution = {
	readonly kind: "identify_segment";
	readonly segmentKind: CircleMeasureKind;
};

export type DeriveMissingMeasureSolution = {
	readonly kind: "derive_missing_measure";
	readonly givenKind: CircleMeasureKind;
	readonly givenLengthCm: number;
	readonly missingKind: CircleMeasureKind;
	readonly missingLengthCm: number;
};

export type MeasureWithRulerSolution = {
	readonly kind: "measure_with_ruler";
	readonly radiusCm: number;
	readonly diameterCm: number;
};

export type CirclesSolution =
	| IdentifySegmentSolution
	| DeriveMissingMeasureSolution
	| MeasureWithRulerSolution;

export const DEFAULT_CIRCLES_DIFFICULTY: CirclesDifficulty = {
	minRadiusCm: 1,
	maxRadiusCm: 4,
	enabledPromptKinds: ["identify_segment", "derive_missing_measure"],
};

function pickInt(min: number, max: number, rng: () => number): number {
	return Math.floor(rng() * (max - min + 1)) + min;
}

function pickOne<T>(items: readonly T[], rng: () => number): T {
	return items[Math.floor(rng() * items.length)];
}

export function validateCirclesDifficulty(
	difficulty: CirclesDifficulty,
): CirclesDifficulty {
	const minRadiusCm = Math.max(
		1,
		Math.min(4, difficulty.minRadiusCm),
	) as CirclesDifficulty["minRadiusCm"];
	const maxRadiusCm = Math.max(
		minRadiusCm,
		Math.min(4, difficulty.maxRadiusCm),
	) as CirclesDifficulty["maxRadiusCm"];
	const enabledPromptKinds =
		difficulty.enabledPromptKinds.length > 0
			? difficulty.enabledPromptKinds
			: DEFAULT_CIRCLES_DIFFICULTY.enabledPromptKinds;
	return {
		minRadiusCm,
		maxRadiusCm,
		enabledPromptKinds,
	};
}

export function generateCirclesProblem(
	difficulty: CirclesDifficulty = DEFAULT_CIRCLES_DIFFICULTY,
	rng: () => number = Math.random,
): CirclesProblem {
	const validated = validateCirclesDifficulty(difficulty);
	const radiusCm = pickInt(validated.minRadiusCm, validated.maxRadiusCm, rng);
	const diameterCm = radiusCm * 2;
	const kind = pickOne(validated.enabledPromptKinds, rng);

	if (kind === "identify_segment") {
		return {
			kind,
			radiusCm,
			diameterCm,
			showCenterPoint: false,
			segmentKind: pickOne(["radius", "diameter"], rng),
		};
	}

	return {
		kind: "derive_missing_measure",
		radiusCm,
		diameterCm,
		showCenterPoint: false,
		givenKind: pickOne(["radius", "diameter"], rng),
		givenLengthCm:
			pickOne(["radius", "diameter"], rng) === "radius" ? radiusCm : diameterCm,
		missingKind: "radius",
	};
}

export function normalizeCirclesProblem(
	problem: CirclesProblem,
): CirclesProblem {
	if (problem.kind !== "derive_missing_measure") return problem;
	const givenLengthCm =
		problem.givenKind === "radius" ? problem.radiusCm : problem.diameterCm;
	const missingKind = problem.givenKind === "radius" ? "diameter" : "radius";
	return { ...problem, givenLengthCm, missingKind };
}

export function computeCirclesSolution(
	problem: CirclesProblem,
): CirclesSolution {
	const normalized = normalizeCirclesProblem(problem);
	switch (normalized.kind) {
		case "identify_segment":
			return {
				kind: normalized.kind,
				segmentKind: normalized.segmentKind,
			};
		case "derive_missing_measure":
			return {
				kind: normalized.kind,
				givenKind: normalized.givenKind,
				givenLengthCm: normalized.givenLengthCm,
				missingKind: normalized.missingKind,
				missingLengthCm:
					normalized.missingKind === "radius"
						? normalized.radiusCm
						: normalized.diameterCm,
			};
		case "measure_with_ruler":
			return {
				kind: normalized.kind,
				radiusCm: normalized.radiusCm,
				diameterCm: normalized.diameterCm,
			};
	}
}
