import type { CellStatus } from "@react/store";
import { colors, typography } from "@react/theme";
import { StyleSheet, Text, TextInput, View } from "react-native";

export const CELL_SIZE = 48;

type DigitCellProps =
	| {
			mode: "input";
			value: string;
			status: CellStatus;
			locked?: boolean;
			maxLength?: number;
			onChangeText: (t: string) => void;
			testID?: string;
	  }
	| { mode: "static"; value: string; testID?: string }
	| { mode: "empty"; testID?: string };

export function DigitCell(props: DigitCellProps) {
	if (props.mode === "empty") {
		return <View style={styles.cell} testID={props.testID} />;
	}

	if (props.mode === "static") {
		return (
			<View style={styles.cell} testID={props.testID}>
				<Text style={styles.digit}>{props.value}</Text>
			</View>
		);
	}

	// mode === "input"
	const {
		value,
		status,
		locked = false,
		maxLength: maxLen = 1,
		onChangeText,
		testID,
	} = props;
	const editable = !locked && status !== "correct";

	const cellStyle = [
		styles.cell,
		styles.inputCell,
		locked
			? styles.lockedCell
			: status === "correct"
				? styles.correctCell
				: status === "incorrect"
					? styles.incorrectCell
					: styles.idleCell,
	];

	return (
		<View style={cellStyle} testID={testID}>
			<TextInput
				value={value}
				onChangeText={(t) => {
					if (t === "") {
						onChangeText("");
						return;
					}
					const digits = t.replace(/\D/g, "").slice(-maxLen);
					if (digits.length > 0) onChangeText(digits);
				}}
				editable={editable}
				maxLength={maxLen}
				selectTextOnFocus
				keyboardType="numeric"
				style={[
					value.length > 1 ? styles.inputSmall : styles.input,
					locked
						? styles.lockedText
						: status === "correct"
							? styles.correctText
							: status === "incorrect"
								? styles.incorrectText
								: styles.idleText,
				]}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	cell: {
		width: CELL_SIZE,
		height: CELL_SIZE,
		alignItems: "center",
		justifyContent: "center",
	},
	digit: {
		fontSize: typography.fontSize["2xl"],
		fontWeight: typography.fontWeight.semibold,
		color: colors.text,
		fontVariant: ["tabular-nums"],
	},
	inputCell: {
		borderWidth: 1,
		borderRadius: 4,
	},
	idleCell: {
		borderColor: colors.border,
		backgroundColor: colors.background,
	},
	correctCell: {
		borderColor: colors.success,
		backgroundColor: colors.successSurface,
	},
	incorrectCell: {
		borderColor: colors.error,
		backgroundColor: colors.errorSurface,
	},
	lockedCell: {
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	input: {
		fontSize: typography.fontSize["2xl"],
		fontWeight: typography.fontWeight.semibold,
		fontVariant: ["tabular-nums"],
		textAlign: "center",
		width: "100%",
		height: "100%",
	},
	inputSmall: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
		fontVariant: ["tabular-nums"],
		textAlign: "center",
		width: "100%",
		height: "100%",
	},
	idleText: {
		color: colors.text,
	},
	correctText: {
		color: colors.success,
	},
	incorrectText: {
		color: colors.error,
	},
	lockedText: {
		color: colors.textMuted,
	},
});
