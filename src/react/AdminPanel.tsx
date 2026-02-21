import type { AdditionDifficulty } from "@domain/addition";
import type { SubtractionDifficulty } from "@domain/subtraction";
import { type Mode, useAdditionStore } from "@react/store";
import { colors, radius, spacing, typography } from "@react/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

const NUM_PLACES_OPTIONS = [1, 2, 3, 4] as const;

export function AdminPanel() {
	const difficulty = useAdditionStore((s) => s.difficulty);
	const setDifficulty = useAdditionStore((s) => s.setDifficulty);
	const subtractionDifficulty = useAdditionStore(
		(s) => s.subtractionDifficulty,
	);
	const setSubtractionDifficulty = useAdditionStore(
		(s) => s.setSubtractionDifficulty,
	);
	const operation = useAdditionStore((s) => s.operation);
	const mode = useAdditionStore((s) => s.mode);
	const setMode = useAdditionStore((s) => s.setMode);

	const numCarriesOptions = Array.from(
		{ length: difficulty.numPlaces + 1 },
		(_, i) => i,
	);

	const numBorrowsOptions = Array.from(
		{ length: subtractionDifficulty.numPlaces },
		(_, i) => i,
	);

	function handleNumPlaces(n: (typeof NUM_PLACES_OPTIONS)[number]) {
		if (operation === "subtraction") {
			const numBorrows = Math.min(
				subtractionDifficulty.numBorrows,
				n - 1,
			) as SubtractionDifficulty["numBorrows"];
			setSubtractionDifficulty({ numPlaces: n, numBorrows });
		} else {
			const numCarries = Math.min(
				difficulty.numCarries,
				n,
			) as AdditionDifficulty["numCarries"];
			setDifficulty({ numPlaces: n, numCarries });
		}
	}

	function handleNumCarries(n: number) {
		setDifficulty({
			numPlaces: difficulty.numPlaces,
			numCarries: n as AdditionDifficulty["numCarries"],
		});
	}

	function handleNumBorrows(n: number) {
		setSubtractionDifficulty({
			numPlaces: subtractionDifficulty.numPlaces,
			numBorrows: n as SubtractionDifficulty["numBorrows"],
		});
	}

	function handleReset() {
		setDifficulty({ numPlaces: 3, numCarries: 2 });
		setSubtractionDifficulty({ numPlaces: 3, numBorrows: 2 });
	}

	const activeDifficulty =
		operation === "subtraction" ? subtractionDifficulty : difficulty;

	return (
		<View style={styles.panel}>
			<Text style={styles.heading}>Settings</Text>

			<View style={styles.section}>
				<Text style={styles.label}>Number of Digits</Text>
				<View style={styles.buttonRow}>
					{NUM_PLACES_OPTIONS.map((n) => (
						<Pressable
							key={n}
							style={[
								styles.optionButton,
								activeDifficulty.numPlaces === n && styles.optionButtonActive,
							]}
							onPress={() => handleNumPlaces(n)}
						>
							<Text
								style={[
									styles.optionText,
									activeDifficulty.numPlaces === n && styles.optionTextActive,
								]}
							>
								{n}
							</Text>
						</Pressable>
					))}
				</View>
			</View>

			{operation === "addition" ? (
				<View style={styles.section}>
					<Text style={styles.label}>Number of Carries</Text>
					<View style={styles.buttonRow}>
						{numCarriesOptions.map((n) => (
							<Pressable
								key={n}
								style={[
									styles.optionButton,
									difficulty.numCarries === n && styles.optionButtonActive,
								]}
								onPress={() => handleNumCarries(n)}
							>
								<Text
									style={[
										styles.optionText,
										difficulty.numCarries === n && styles.optionTextActive,
									]}
								>
									{n}
								</Text>
							</Pressable>
						))}
					</View>
				</View>
			) : (
				<View style={styles.section}>
					<Text style={styles.label}>Number of Borrows</Text>
					<View style={styles.buttonRow}>
						{numBorrowsOptions.map((n) => (
							<Pressable
								key={n}
								style={[
									styles.optionButton,
									subtractionDifficulty.numBorrows === n &&
										styles.optionButtonActive,
								]}
								onPress={() => handleNumBorrows(n)}
							>
								<Text
									style={[
										styles.optionText,
										subtractionDifficulty.numBorrows === n &&
											styles.optionTextActive,
									]}
								>
									{n}
								</Text>
							</Pressable>
						))}
					</View>
				</View>
			)}

			<View style={styles.section}>
				<Text style={styles.label}>Mode</Text>
				<View style={styles.buttonRow}>
					{(["digit", "visual"] as Mode[]).map((m) => (
						<Pressable
							key={m}
							style={[
								styles.optionButton,
								styles.modeButton,
								mode === m && styles.optionButtonActive,
							]}
							onPress={() => setMode(m)}
							// @ts-ignore — web-only
							data-testid={`mode-btn-${m}`}
							testID={`mode-btn-${m}`}
						>
							<Text
								style={[
									styles.optionText,
									mode === m && styles.optionTextActive,
								]}
							>
								{m === "digit" ? "Digit" : "Visual"}
							</Text>
						</Pressable>
					))}
				</View>
			</View>

			<Pressable style={styles.resetButton} onPress={handleReset}>
				<Text style={styles.resetText}>Reset to Defaults</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	panel: {
		gap: spacing.xl,
	},
	heading: {
		fontSize: typography.fontSize["2xl"],
		fontWeight: typography.fontWeight.bold,
		color: colors.text,
	},
	section: {
		gap: spacing.sm,
	},
	label: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
		color: colors.textMuted,
	},
	buttonRow: {
		flexDirection: "row",
		gap: spacing.sm,
	},
	optionButton: {
		width: 48,
		height: 48,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.background,
		alignItems: "center",
		justifyContent: "center",
	},
	modeButton: {
		width: 72,
	},
	optionButtonActive: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	optionText: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
		color: colors.text,
	},
	optionTextActive: {
		color: colors.background,
	},
	resetButton: {
		alignSelf: "flex-start",
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
	},
	resetText: {
		fontSize: typography.fontSize.base,
		color: colors.textMuted,
	},
});
