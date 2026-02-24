import { AdditionProblemSolver } from "@react/AdditionProblemSolver";
import { AdminPanel } from "@react/AdminPanel";
import { CollapsibleSection } from "@react/CollapsibleSection";
import { StatsPanel } from "@react/StatsPanel";
import { VisualProblemSolver } from "@react/VisualProblemSolver";
import { useAdditionStore } from "@react/store";
import { colors, radius, spacing, typography } from "@react/theme";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AdditionScreen() {
	const {
		numDigits: rawNumDigits,
		numCarries: rawNumCarries,
		mode: rawMode,
	} = useLocalSearchParams<{
		numDigits?: string;
		numCarries?: string;
		mode?: string;
	}>();

	const difficulty = useAdditionStore((s) => s.difficulty);
	const mode = useAdditionStore((s) => s.mode);
	const subtractionDifficulty = useAdditionStore(
		(s) => s.subtractionDifficulty,
	);
	const newProblem = useAdditionStore((s) => s.newProblem);
	const setOperation = useAdditionStore((s) => s.setOperation);
	const setDifficulty = useAdditionStore((s) => s.setDifficulty);
	const setMode = useAdditionStore((s) => s.setMode);

	// On initial mount, sync URL params → store (handles deep links)
	const didSyncRef = useRef(false);
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional run-once on mount
	useEffect(() => {
		if (didSyncRef.current) return;
		didSyncRef.current = true;

		if (rawNumDigits !== undefined || rawNumCarries !== undefined) {
			const numPlaces = Math.max(
				1,
				Math.min(
					4,
					Number.parseInt(rawNumDigits ?? String(difficulty.numPlaces), 10),
				),
			) as 1 | 2 | 3 | 4;
			const numCarries = Math.max(
				0,
				Math.min(
					numPlaces,
					Number.parseInt(rawNumCarries ?? String(difficulty.numCarries), 10),
				),
			) as 0 | 1 | 2 | 3 | 4;
			if (
				numPlaces !== difficulty.numPlaces ||
				numCarries !== difficulty.numCarries
			) {
				setDifficulty({ numPlaces, numCarries });
			}
		}

		if (rawMode !== undefined) {
			const parsedMode = rawMode === "visual" ? "visual" : "digit";
			if (parsedMode !== mode) {
				setMode(parsedMode);
			}
		}
	}, []);

	// Set operation when this screen is focused (preserves attempt-recording side effect)
	useFocusEffect(
		useCallback(() => {
			setOperation("addition");
		}, [setOperation]),
	);

	// Mirror store changes → URL params
	useEffect(() => {
		router.setParams({
			numDigits: String(difficulty.numPlaces),
			numCarries: String(difficulty.numCarries),
			mode,
		});
	}, [difficulty, mode]);

	function handleSwitchToSubtraction() {
		router.push({
			pathname: "/subtraction",
			params: {
				numDigits: String(subtractionDifficulty.numPlaces),
				numBorrows: String(subtractionDifficulty.numBorrows),
			},
		});
	}

	return (
		<View style={styles.page}>
			{/* Quiz area — plain View so pointer events reach VisualProblemSolver */}
			<View style={styles.quizArea}>
				<View style={styles.header}>
					<Text style={styles.title}>Long Arithmetic</Text>
				</View>

				<View style={styles.operationToggle}>
					<Pressable
						style={[styles.operationButton, styles.operationButtonActive]}
						// @ts-ignore — web-only
						data-testid="operation-btn-addition"
						testID="operation-btn-addition"
					>
						<Text style={[styles.operationText, styles.operationTextActive]}>
							Addition
						</Text>
					</Pressable>
					<Pressable
						style={styles.operationButton}
						onPress={handleSwitchToSubtraction}
						// @ts-ignore — web-only
						data-testid="operation-btn-subtraction"
						testID="operation-btn-subtraction"
					>
						<Text style={styles.operationText}>Subtraction</Text>
					</Pressable>
				</View>

				<View style={styles.problemCard}>
					{mode === "visual" ? (
						<VisualProblemSolver />
					) : (
						<AdditionProblemSolver />
					)}
				</View>

				<Pressable
					style={({ pressed }) => [
						styles.button,
						pressed && styles.buttonPressed,
					]}
					onPress={newProblem}
				>
					<Text style={styles.buttonText}>New Problem</Text>
				</Pressable>
			</View>

			{/* Settings/Stats — in a ScrollView so long panels are reachable */}
			<ScrollView
				style={styles.settingsScroll}
				contentContainerStyle={styles.settingsContent}
				keyboardShouldPersistTaps="handled"
			>
				<CollapsibleSection title="Settings" defaultOpen={false}>
					<AdminPanel />
				</CollapsibleSection>

				<CollapsibleSection title="Statistics">
					<StatsPanel />
				</CollapsibleSection>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	page: {
		flex: 1,
		backgroundColor: colors.background,
	},
	quizArea: {
		alignItems: "center",
		padding: spacing.md,
		gap: spacing.xl,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
	},
	title: {
		fontSize: typography.fontSize["2xl"],
		fontWeight: typography.fontWeight.bold,
		color: colors.text,
	},
	operationToggle: {
		flexDirection: "row",
		gap: spacing.sm,
	},
	operationButton: {
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.background,
	},
	operationButtonActive: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	operationText: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
		color: colors.text,
	},
	operationTextActive: {
		color: colors.background,
	},
	problemCard: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		padding: spacing.xl,
		borderWidth: 1,
		borderColor: colors.border,
	},
	button: {
		backgroundColor: colors.primary,
		borderRadius: radius.md,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.xl,
	},
	buttonPressed: {
		backgroundColor: colors.primaryHover,
	},
	buttonText: {
		color: colors.background,
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
	},
	settingsScroll: {
		width: "100%",
	},
	settingsContent: {
		gap: spacing.md,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
});
