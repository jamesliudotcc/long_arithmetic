import { AdditionProblemSolver } from "@react/AdditionProblemSolver";
import { Toolbox } from "@react/Toolbox";
import { VisualProblemSolver } from "@react/VisualProblemSolver";
import { useAdditionStore } from "@react/store";
import { colors, radius, spacing, typography } from "@react/theme";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
	const newProblem = useAdditionStore((s) => s.newProblem);
	const setOperation = useAdditionStore((s) => s.setOperation);
	const setDifficulty = useAdditionStore((s) => s.setDifficulty);
	const setMode = useAdditionStore((s) => s.setMode);
	const setToolboxOpen = useAdditionStore((s) => s.setToolboxOpen);

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

	// Mirror store changes → URL params (guarded: navigator may not be ready on first effect)
	useEffect(() => {
		try {
			router.setParams({
				numDigits: String(difficulty.numPlaces),
				numCarries: String(difficulty.numCarries),
				mode,
			});
		} catch {
			// navigator not ready yet on initial mount; params are already in the URL
		}
	}, [difficulty, mode]);

	return (
		<View style={styles.page}>
			{/* Quiz area — plain View so pointer events reach VisualProblemSolver */}
			<View style={styles.quizArea}>
				<View style={styles.header}>
					<Text style={styles.title}>Long Arithmetic</Text>
					<Pressable
						style={styles.hamburger}
						onPress={() => setToolboxOpen(true)}
					>
						<Text style={styles.hamburgerText}>☰</Text>
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

			<Toolbox />
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
		justifyContent: "space-between",
		width: "100%",
	},
	title: {
		fontSize: typography.fontSize["2xl"],
		fontWeight: typography.fontWeight.bold,
		color: colors.text,
	},
	hamburger: {
		padding: spacing.sm,
	},
	hamburgerText: {
		fontSize: typography.fontSize["2xl"],
		color: colors.text,
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
});
