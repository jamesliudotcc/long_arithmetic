import type { CircleMeasureKind } from "@domain/circles";
import { CircleDiagram } from "@react/CircleDiagram";
import { CELL_SIZE } from "@react/DigitCell";
import { useAdditionStore } from "@react/store";
import { colors, radius, spacing, typography } from "@react/theme";
import {
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
	useWindowDimensions,
} from "react-native";

function ChoiceButton({
	label,
	value,
	selected,
	onPress,
}: {
	readonly label: string;
	readonly value: CircleMeasureKind;
	readonly selected: boolean;
	readonly onPress: (value: CircleMeasureKind) => void;
}) {
	return (
		<Pressable
			style={[styles.choiceButton, selected && styles.choiceButtonSelected]}
			onPress={() => onPress(value)}
			// @ts-ignore — web-only
			data-testid={`circle-choice-${value}`}
			testID={`circle-choice-${value}`}
		>
			<Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
				{label}
			</Text>
		</Pressable>
	);
}

export function CirclesProblemSolver() {
	const problem = useAdditionStore((s) => s.circlesProblem);
	const solution = useAdditionStore((s) => s.circlesSolution);
	const work = useAdditionStore((s) => s.circlesWork);
	const answerCircleSegment = useAdditionStore((s) => s.answerCircleSegment);
	const enterCircleMeasure = useAdditionStore((s) => s.enterCircleMeasure);
	const { width } = useWindowDimensions();
	const horizontal = width >= 900;

	return (
		<View
			style={[styles.container, horizontal ? styles.row : styles.column]}
			// @ts-ignore — web-only
			data-testid="circles-problem-solver"
			testID="circles-problem-solver"
		>
			<CircleDiagram problem={problem} />
			<View style={styles.panel}>
				<Text style={styles.kicker}>Circles</Text>
				{problem.kind === "identify_segment" ? (
					<>
						<Text style={styles.prompt}>
							Is the highlighted segment a radius or a diameter?
						</Text>
						<View style={styles.choiceRow}>
							<ChoiceButton
								label="Radius"
								value="radius"
								selected={work.segmentAnswer === "radius"}
								onPress={answerCircleSegment}
							/>
							<ChoiceButton
								label="Diameter"
								value="diameter"
								selected={work.segmentAnswer === "diameter"}
								onPress={answerCircleSegment}
							/>
						</View>
						{work.segmentStatus === "incorrect" ? (
							<Text style={styles.errorText}>Try again.</Text>
						) : null}
					</>
				) : (
					<>
						<Text style={styles.prompt}>
							The highlighted {solution.kind === "derive_missing_measure"
								? solution.givenKind
								: "segment"} is {solution.kind === "derive_missing_measure"
								? `${solution.givenLengthCm} cm`
								: ""}.
						</Text>
						<Text style={styles.secondaryPrompt}>
							Enter the {solution.kind === "derive_missing_measure"
								? solution.missingKind
								: "missing measure"}:
						</Text>
						<View style={styles.measureRow}>
							<View
								style={[
									styles.inputBox,
									work.measureStatus === "correct"
										? styles.correctBox
										: work.measureStatus === "incorrect"
											? styles.incorrectBox
											: styles.idleBox,
								]}
							>
								<TextInput
									value={work.measureAnswer}
									onChangeText={(text) => {
										const digits = text.replace(/\D/g, "").slice(0, 2);
										enterCircleMeasure(digits);
									}}
									editable={!work.solved}
									keyboardType="numeric"
									style={styles.input}
									// @ts-ignore — web-only
									data-testid="circle-missing-measure-input"
									testID="circle-missing-measure-input"
								/>
							</View>
							<Text style={styles.unitText}>cm</Text>
						</View>
						{work.measureStatus === "incorrect" ? (
							<Text style={styles.errorText}>Try again.</Text>
						) : null}
					</>
				)}
				{work.solved ? (
					<View style={styles.banner} testID="circles-correct-banner">
						<Text style={styles.bannerText}>Correct!</Text>
					</View>
				) : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		gap: spacing.xl,
		alignItems: "stretch",
	},
	row: {
		flexDirection: "row",
	},
	column: {
		flexDirection: "column",
	},
	panel: {
		flex: 1,
		minWidth: 280,
		gap: spacing.md,
		justifyContent: "center",
	},
	kicker: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.bold,
		color: colors.primary,
		textTransform: "uppercase",
	},
	prompt: {
		fontSize: typography.fontSize.xl,
		lineHeight: typography.lineHeight.relaxed,
		fontWeight: typography.fontWeight.semibold,
		color: colors.text,
	},
	secondaryPrompt: {
		fontSize: typography.fontSize.lg,
		color: colors.textMuted,
	},
	choiceRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: spacing.md,
	},
	choiceButton: {
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.xl,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.background,
	},
	choiceButtonSelected: {
		backgroundColor: colors.successSurface,
		borderColor: colors.success,
	},
	choiceText: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
		color: colors.text,
	},
	choiceTextSelected: {
		color: colors.success,
	},
	measureRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	inputBox: {
		width: CELL_SIZE * 1.5,
		height: CELL_SIZE,
		borderWidth: 1,
		borderRadius: radius.md,
	},
	idleBox: {
		borderColor: colors.border,
		backgroundColor: colors.background,
	},
	correctBox: {
		borderColor: colors.success,
		backgroundColor: colors.successSurface,
	},
	incorrectBox: {
		borderColor: colors.error,
		backgroundColor: colors.errorSurface,
	},
	input: {
		width: "100%",
		height: "100%",
		padding: 0,
		textAlign: "center",
		fontSize: typography.fontSize["2xl"],
		fontWeight: typography.fontWeight.semibold,
		color: colors.text,
	},
	unitText: {
		fontSize: typography.fontSize.lg,
		color: colors.text,
	},
	errorText: {
		fontSize: typography.fontSize.base,
		color: colors.error,
	},
	banner: {
		paddingTop: spacing.md,
	},
	bannerText: {
		fontSize: typography.fontSize.xl,
		fontWeight: typography.fontWeight.bold,
		color: colors.success,
	},
});
