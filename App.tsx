import { AdditionProblemSolver } from "@react/AdditionProblemSolver";
import { useAdditionStore } from "@react/store";
import { colors, radius, spacing, typography } from "@react/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function App() {
	const newProblem = useAdditionStore((s) => s.newProblem);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Long Arithmetic</Text>
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
	title: {
		fontSize: typography.fontSize["2xl"],
		fontWeight: typography.fontWeight.bold,
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
