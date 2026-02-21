import { AdditionProblemSolver } from "@react/AdditionProblemSolver";
import { AdminPanel } from "@react/AdminPanel";
import { CollapsibleSection } from "@react/CollapsibleSection";
import { StatsPanel } from "@react/StatsPanel";
import { SubtractionProblemSolver } from "@react/SubtractionProblemSolver";
import { VisualProblemSolver } from "@react/VisualProblemSolver";
import { useAdditionStore } from "@react/store";
import { colors, radius, spacing, typography } from "@react/theme";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Screen = "quiz" | "admin";

export default function App() {
	const [screen, setScreen] = useState<Screen>("quiz");
	const newProblem = useAdditionStore((s) => s.newProblem);
	const mode = useAdditionStore((s) => s.mode);
	const operation = useAdditionStore((s) => s.operation);
	const setOperation = useAdditionStore((s) => s.setOperation);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>Long Arithmetic</Text>
				<Pressable
					style={styles.iconButton}
					onPress={() => setScreen(screen === "quiz" ? "admin" : "quiz")}
					// @ts-ignore — web-only
					data-testid="settings-btn"
					testID="settings-btn"
				>
					<Text style={styles.iconButtonText}>
						{screen === "quiz" ? "⚙" : "✕"}
					</Text>
				</Pressable>
			</View>

			{screen === "quiz" ? (
				<>
					<View style={styles.operationToggle}>
						{(["addition", "subtraction"] as const).map((op) => (
							<Pressable
								key={op}
								style={[
									styles.operationButton,
									operation === op && styles.operationButtonActive,
								]}
								onPress={() => setOperation(op)}
								// @ts-ignore — web-only
								data-testid={`operation-btn-${op}`}
								testID={`operation-btn-${op}`}
							>
								<Text
									style={[
										styles.operationText,
										operation === op && styles.operationTextActive,
									]}
								>
									{op === "addition" ? "Addition" : "Subtraction"}
								</Text>
							</Pressable>
						))}
					</View>

					<View style={styles.problemCard}>
						{operation === "subtraction" ? (
							<SubtractionProblemSolver />
						) : mode === "visual" ? (
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
				</>
			) : (
				<ScrollView
					style={styles.adminScroll}
					contentContainerStyle={styles.adminContent}
				>
					<CollapsibleSection title="Settings" defaultOpen>
						<AdminPanel />
					</CollapsibleSection>
					<CollapsibleSection title="Statistics">
						<StatsPanel />
					</CollapsibleSection>
				</ScrollView>
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
	adminScroll: {
		width: "100%",
	},
	adminContent: {
		gap: spacing.md,
		paddingVertical: spacing.sm,
	},
});
