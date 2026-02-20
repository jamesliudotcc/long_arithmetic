import { useAdditionStore } from "@react/store";
import { colors, radius, spacing, typography } from "@react/theme";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Period = "all" | "today";

const DIGIT_LABELS: Record<1 | 2 | 3 | 4, string> = {
	1: "1 digit",
	2: "2 digits",
	3: "3 digits",
	4: "4 digits",
};

export function StatsPanel() {
	const attempts = useAdditionStore((s) => s.attempts);
	const periodStart = useAdditionStore((s) => s.periodStart);
	const resetPeriod = useAdditionStore((s) => s.resetPeriod);

	const [period, setPeriod] = useState<Period>("all");

	const filtered =
		period === "today"
			? attempts.filter((a) => a.timestamp >= periodStart)
			: attempts;

	return (
		<View style={styles.panel}>
			<View style={styles.toggleRow}>
				<Pressable
					style={[
						styles.toggleButton,
						period === "all" && styles.toggleButtonActive,
					]}
					onPress={() => setPeriod("all")}
				>
					<Text
						style={[
							styles.toggleText,
							period === "all" && styles.toggleTextActive,
						]}
					>
						All Time
					</Text>
				</Pressable>
				<Pressable
					style={[
						styles.toggleButton,
						period === "today" && styles.toggleButtonActive,
					]}
					onPress={() => setPeriod("today")}
				>
					<Text
						style={[
							styles.toggleText,
							period === "today" && styles.toggleTextActive,
						]}
					>
						Today
					</Text>
				</Pressable>
				<Pressable style={styles.resetButton} onPress={resetPeriod}>
					<Text style={styles.resetText}>↺ Reset</Text>
				</Pressable>
			</View>

			<View style={styles.rows}>
				{([1, 2, 3, 4] as const).map((n) => {
					const rowAttempts = filtered.filter((a) => a.numPlaces === n);
					const total = rowAttempts.length;
					const correct = rowAttempts.filter((a) => a.correct).length;

					if (period === "all" && total === 0) return null;

					const pct =
						total === 0 ? "—" : `${Math.round((correct / total) * 100)}%`;

					return (
						<View key={n} style={styles.row}>
							<Text style={styles.rowLabel}>{DIGIT_LABELS[n]}</Text>
							<Text style={styles.rowStat}>
								{total === 0 ? "—" : `${total} attempted, ${pct} correct`}
							</Text>
						</View>
					);
				})}
				{filtered.length === 0 && (
					<Text style={styles.empty}>No attempts yet.</Text>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	panel: {
		gap: spacing.md,
	},
	toggleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	toggleButton: {
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.md,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.background,
	},
	toggleButtonActive: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	toggleText: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
		color: colors.text,
	},
	toggleTextActive: {
		color: colors.background,
	},
	resetButton: {
		marginLeft: "auto",
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.md,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
	},
	resetText: {
		fontSize: typography.fontSize.base,
		color: colors.textMuted,
	},
	rows: {
		gap: spacing.sm,
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	rowLabel: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
		color: colors.text,
	},
	rowStat: {
		fontSize: typography.fontSize.base,
		color: colors.textMuted,
	},
	empty: {
		fontSize: typography.fontSize.base,
		color: colors.textMuted,
		fontStyle: "italic",
	},
});
