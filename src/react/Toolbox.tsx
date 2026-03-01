import { AdminPanel } from "@react/AdminPanel";
import { CollapsibleSection } from "@react/CollapsibleSection";
import { StatsPanel } from "@react/StatsPanel";
import { useAdditionStore } from "@react/store";
import { colors, spacing } from "@react/theme";
import {
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";

export function Toolbox() {
	const toolboxOpen = useAdditionStore((s) => s.toolboxOpen);
	const setToolboxOpen = useAdditionStore((s) => s.setToolboxOpen);

	function close() {
		setToolboxOpen(false);
	}

	return (
		<Modal
			visible={toolboxOpen}
			transparent
			animationType="none"
			onRequestClose={close}
		>
			<View style={styles.overlay}>
				<Pressable style={styles.backdrop} onPress={close} />
				<View style={styles.panel}>
					<View style={styles.panelHeader}>
						<Text style={styles.panelTitle}>Settings & Stats</Text>
						<Pressable onPress={close} style={styles.closeButton}>
							<Text style={styles.closeText}>✕</Text>
						</Pressable>
					</View>
					<ScrollView
						contentContainerStyle={styles.scrollContent}
						keyboardShouldPersistTaps="handled"
					>
						<CollapsibleSection title="Settings" defaultOpen={true}>
							<AdminPanel />
						</CollapsibleSection>
						<CollapsibleSection title="Statistics" defaultOpen={true}>
							<StatsPanel />
						</CollapsibleSection>
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		flexDirection: "row",
	},
	backdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.3)",
	},
	panel: {
		width: 320,
		backgroundColor: colors.background,
		borderLeftWidth: 1,
		borderLeftColor: colors.border,
		shadowColor: "#000",
		shadowOffset: { width: -2, height: 0 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 8,
	},
	panelHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
		backgroundColor: colors.surface,
	},
	panelTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: colors.text,
	},
	closeButton: {
		padding: spacing.sm,
	},
	closeText: {
		fontSize: 18,
		color: colors.textMuted,
	},
	scrollContent: {
		gap: spacing.md,
		padding: spacing.md,
	},
});
