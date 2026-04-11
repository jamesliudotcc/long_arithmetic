import type {
	CircleMeasureKind,
	CirclesProblem,
} from "@domain/circles";
import { colors, radius, spacing, typography } from "@react/theme";
import { StyleSheet, Text, View } from "react-native";

type CircleDiagramProps = {
	readonly problem: CirclesProblem;
};

function segmentLabelText(problem: CirclesProblem): string | null {
	if (problem.kind !== "derive_missing_measure") return null;
	return `${problem.givenLengthCm} cm`;
}

function lineWidthForSegment(kind: CircleMeasureKind, circleDiameterPx: number) {
	return kind === "diameter" ? circleDiameterPx : circleDiameterPx / 2;
}

export function CircleDiagram({ problem }: CircleDiagramProps) {
	const segmentKind =
		problem.kind === "identify_segment" ? problem.segmentKind : problem.givenKind;
	const labelText = segmentLabelText(problem);
	const circleDiameterPx = 220;
	const segmentWidth = lineWidthForSegment(segmentKind, circleDiameterPx);

	return (
		<View
			style={styles.card}
			// @ts-ignore — web-only
			data-testid="circle-diagram"
			testID="circle-diagram"
		>
			<View style={styles.canvas}>
				<View style={[styles.circle, { width: circleDiameterPx, height: circleDiameterPx }]} />
				<View style={styles.centerPoint} />
				<View
					style={[
						styles.segment,
						{
							width: segmentWidth,
							left: segmentKind === "diameter" ? 30 : 30 + circleDiameterPx / 2,
						},
					]}
					// @ts-ignore — web-only
					data-testid={`circle-segment-${segmentKind}`}
					testID={`circle-segment-${segmentKind}`}
				/>
				{labelText ? <Text style={styles.label}>{labelText}</Text> : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		alignItems: "center",
		justifyContent: "center",
		minWidth: 320,
		padding: spacing.md,
		borderRadius: radius.lg,
		backgroundColor: colors.surface,
	},
	canvas: {
		width: 280,
		height: 260,
		alignItems: "center",
		justifyContent: "center",
	},
	circle: {
		borderWidth: 4,
		borderColor: colors.primary,
		borderRadius: 999,
	},
	centerPoint: {
		position: "absolute",
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: colors.text,
	},
	segment: {
		position: "absolute",
		height: 6,
		top: 127,
		backgroundColor: colors.warning,
		borderRadius: radius.full,
	},
	label: {
		position: "absolute",
		top: 88,
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.bold,
		color: colors.text,
		backgroundColor: colors.background,
		paddingHorizontal: spacing.xs,
	},
});
