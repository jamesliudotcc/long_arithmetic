import { AdditionProblemSolver } from "@react/AdditionProblemSolver";
import { AdminPanel } from "@react/AdminPanel";
import { useAdditionStore } from "@react/store";
import { colors, radius, spacing, typography } from "@react/theme";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Screen = "quiz" | "admin";

export default function App() {
	const [screen, setScreen] = useState<Screen>("quiz");
	const newProblem = useAdditionStore((s) => s.newProblem);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>Long Arithmetic</Text>
				<Pressable
					style={styles.iconButton}
					onPress={() => setScreen(screen === "quiz" ? "admin" : "quiz")}
				>
					<Text style={styles.iconButtonText}>
						{screen === "quiz" ? "⚙" : "✕"}
					</Text>
				</Pressable>
			</View>

			{screen === "quiz" ? (
				<>
					<View style={styles.problemCard}>
						<AdditionProblemSolver />
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
				</>
			) : (
				<View style={styles.problemCard}>
					<AdminPanel />
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.background,
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
	iconButton: {
		padding: spacing.sm,
	},
	iconButtonText: {
		fontSize: typography.fontSize.xl,
		color: colors.textMuted,
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
