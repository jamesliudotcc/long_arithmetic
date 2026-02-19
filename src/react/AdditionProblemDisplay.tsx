import { PLACES, decompose, toNumber } from "@domain/addition";
import type { AdditionProblem } from "@domain/addition";
import { colors, spacing, typography } from "@react/theme";
import { StyleSheet, Text, View } from "react-native";

const CELL_SIZE = 48;

type Props = { problem: AdditionProblem };

export function AdditionProblemDisplay({ problem }: Props) {
	const { addend1, addend2, numPlaces } = problem;

	const sum = toNumber(addend1) + toNumber(addend2);
	const sumDecomposed = decompose(sum);
	const carryOut = Math.floor(sum / 10 ** numPlaces);

	// Most-significant first
	const displayPlaces = PLACES.slice(0, numPlaces).reverse();

	return (
		<View style={styles.table}>
			{/* Addend 1 row */}
			<View style={styles.row}>
				<View style={styles.cell} />
				{displayPlaces.map((place) => (
					<View key={place} style={styles.cell}>
						<Text style={styles.digit}>{addend1[place]}</Text>
					</View>
				))}
			</View>

			{/* Addend 2 row */}
			<View style={styles.row}>
				<View style={styles.cell}>
					<Text style={styles.operator}>+</Text>
				</View>
				{displayPlaces.map((place) => (
					<View key={place} style={styles.cell}>
						<Text style={styles.digit}>{addend2[place]}</Text>
					</View>
				))}
			</View>

			{/* Dividing line */}
			<View style={[styles.divider, { width: (numPlaces + 1) * CELL_SIZE }]} />

			{/* Sum row */}
			<View style={styles.row}>
				<View style={styles.cell}>
					{carryOut > 0 && <Text style={styles.digit}>{carryOut}</Text>}
				</View>
				{displayPlaces.map((place) => (
					<View key={place} style={styles.cell}>
						<Text style={styles.digit}>{sumDecomposed[place]}</Text>
					</View>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	table: {
		alignItems: "flex-start",
	},
	row: {
		flexDirection: "row",
	},
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
	operator: {
		fontSize: typography.fontSize["2xl"],
		fontWeight: typography.fontWeight.semibold,
		color: colors.primary,
	},
	divider: {
		borderTopWidth: 2,
		borderTopColor: colors.text,
		marginVertical: spacing.xs,
	},
});
