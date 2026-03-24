import { MultiplicationLatticeSolver } from "@react/MultiplicationLatticeSolver";
import { MultiplicationProblemSolver } from "@react/MultiplicationProblemSolver";
import { Toolbox } from "@react/Toolbox";
import { useAdditionStore } from "@react/store";
import { colors, radius, spacing, typography } from "@react/theme";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function MultiplicationScreen() {
	const {
		numDigits: rawNumDigits,
		multiplierPlaces: rawMultiplierPlaces,
		mode: rawMode,
	} = useLocalSearchParams<{
		numDigits?: string;
		multiplierPlaces?: string;
		mode?: string;
	}>();

	const multiplicationDifficulty = useAdditionStore(
		(s) => s.multiplicationDifficulty,
	);
	const newProblem = useAdditionStore((s) => s.newProblem);
	const setOperation = useAdditionStore((s) => s.setOperation);
	const setMultiplicationDifficulty = useAdditionStore(
		(s) => s.setMultiplicationDifficulty,
	);
	const multiplicationMode = useAdditionStore((s) => s.multiplicationMode);
	const setMultiplicationMode = useAdditionStore(
		(s) => s.setMultiplicationMode,
	);
	const setToolboxOpen = useAdditionStore((s) => s.setToolboxOpen);

	// On initial mount, sync URL params → store (handles deep links)
	const didSyncRef = useRef(false);
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional run-once on mount
	useEffect(() => {
		if (didSyncRef.current) return;
		didSyncRef.current = true;

		if (rawNumDigits !== undefined || rawMultiplierPlaces !== undefined) {
			const numPlaces = Math.max(
				1,
				Math.min(
					3,
					Number.parseInt(
						rawNumDigits ?? String(multiplicationDifficulty.numPlaces),
						10,
					),
				),
			) as 1 | 2 | 3;
			const multiplierPlacesRaw = Math.max(
				1,
				Math.min(
					2,
					Number.parseInt(
						rawMultiplierPlaces ??
							String(multiplicationDifficulty.multiplierPlaces),
						10,
					),
				),
			);
			// Clamp multiplierPlaces to numPlaces (multiplier cannot exceed multiplicand digits)
			const multiplierPlaces = Math.min(multiplierPlacesRaw, numPlaces) as
				| 1
				| 2;
			if (
				numPlaces !== multiplicationDifficulty.numPlaces ||
				multiplierPlaces !== multiplicationDifficulty.multiplierPlaces
			) {
				setMultiplicationDifficulty({ numPlaces, multiplierPlaces });
			}
		}

		if (rawMode !== undefined) {
			const parsedMode = rawMode === "lattice" ? "lattice" : "digit";
			if (parsedMode !== multiplicationMode) {
				setMultiplicationMode(parsedMode);
			}
		}
	}, []);

	// Set operation when this screen is focused (preserves attempt-recording side effect)
	useFocusEffect(
		useCallback(() => {
			setOperation("multiplication");
		}, [setOperation]),
	);

	// Mirror store changes → URL params
	useEffect(() => {
		try {
			router.setParams({
				numDigits: String(multiplicationDifficulty.numPlaces),
				multiplierPlaces: String(multiplicationDifficulty.multiplierPlaces),
				mode: multiplicationMode,
			});
		} catch {
			// navigator not ready yet on initial mount
		}
	}, [multiplicationDifficulty, multiplicationMode]);

	return (
		<ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
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
					{multiplicationMode === "lattice" ? (
						<MultiplicationLatticeSolver />
					) : (
						<MultiplicationProblemSolver />
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
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	page: {
		flex: 1,
		backgroundColor: colors.background,
	},
	pageContent: {
		flexGrow: 1,
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
