import { colors, radius, spacing, typography } from "@react/theme";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
	title: string;
	defaultOpen?: boolean;
	children: React.ReactNode;
};

export function CollapsibleSection({
	title,
	defaultOpen = false,
	children,
}: Props) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<View style={styles.container}>
			<Pressable style={styles.header} onPress={() => setOpen((o) => !o)}>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.chevron}>{open ? "▾" : "▸"}</Text>
			</Pressable>
			{open && <View style={styles.body}>{children}</View>}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		borderRadius: radius.md,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: colors.border,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: colors.surface,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
	},
	title: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.bold,
		color: colors.text,
	},
	chevron: {
		fontSize: typography.fontSize.lg,
		color: colors.textMuted,
	},
	body: {
		padding: spacing.md,
		backgroundColor: colors.background,
	},
});
