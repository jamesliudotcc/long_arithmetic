import { type CellStatus, useAdditionStore } from "@react/store";
import { colors, spacing, typography } from "@react/theme";
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

const LATTICE_CELL_SIZE = 96;

function LatticeInput({
	value,
	status,
	onChangeText,
	testID,
	align,
}: {
	value: string;
	status: CellStatus;
	onChangeText: (digit: string) => void;
	testID: string;
	align: "topLeft" | "bottomLeft" | "bottomRight";
}) {
	return (
		<View
			style={[
				styles.inputShell,
				status === "correct"
					? styles.correctShell
					: status === "incorrect"
						? styles.incorrectShell
						: styles.idleShell,
				align === "topLeft"
					? styles.topLeftShell
					: align === "bottomLeft"
						? styles.bottomLeftShell
						: styles.bottomRightShell,
			]}
		>
			<TextInput
				value={value}
				onChangeText={(text) => {
					if (text === "") {
						onChangeText("");
						return;
					}
					const digits = text.replace(/\D/g, "").slice(-1);
					if (digits.length > 0) onChangeText(digits);
				}}
				maxLength={1}
				selectTextOnFocus
				keyboardType="numeric"
				testID={testID}
				style={[
					styles.inputText,
					align === "topLeft"
						? styles.topLeftText
						: align === "bottomLeft"
							? styles.bottomLeftText
							: styles.bottomRightText,
					status === "correct"
						? styles.correctText
						: status === "incorrect"
							? styles.incorrectText
							: styles.idleText,
				]}
			/>
		</View>
	);
}

function LatticeCell({
	tensValue,
	tensStatus,
	onesValue,
	onesStatus,
	onChangeTens,
	onChangeOnes,
	testIDPrefix,
}: {
	tensValue: string;
	tensStatus: CellStatus;
	onesValue: string;
	onesStatus: CellStatus;
	onChangeTens: (digit: string) => void;
	onChangeOnes: (digit: string) => void;
	testIDPrefix: string;
}) {
	return (
		<View style={styles.cell} testID={testIDPrefix}>
			<View style={styles.diagonal} />
			<View style={styles.tensWrap}>
				<LatticeInput
					value={tensValue}
					status={tensStatus}
					onChangeText={onChangeTens}
					testID={`${testIDPrefix}-tens`}
					align="topLeft"
				/>
			</View>
			<View style={styles.onesWrap}>
				<LatticeInput
					value={onesValue}
					status={onesStatus}
					onChangeText={onChangeOnes}
					testID={`${testIDPrefix}-ones`}
					align="bottomRight"
				/>
			</View>
		</View>
	);
}

export function MultiplicationLatticeSolver() {
	const problem = useAdditionStore((s) => s.multiplicationProblem);
	const solution = useAdditionStore((s) => s.multiplicationSolution);
	const work = useAdditionStore((s) => s.latticeWork);
	const enterLatticeCell = useAdditionStore((s) => s.enterLatticeCell);
	const enterLatticeDiagonal = useAdditionStore((s) => s.enterLatticeDiagonal);

	const multiplicandDigits = Array.from(
		{ length: problem.numPlaces },
		(_, col) => {
			return solution.lattice.cells[0][col].multiplicandDigit;
		},
	);
	const multiplierDigits = Array.from(
		{ length: problem.multiplierPlaces },
		(_, row) => solution.lattice.cells[row][0].multiplierDigit,
	);

	return (
		<View
			style={styles.container}
			// @ts-ignore — web-only
			data-testid="multiplication-lattice-solver"
			testID="multiplication-lattice-solver"
		>
			<View style={styles.headerRow}>
				<View style={styles.leftGutter} />
				{multiplicandDigits.map((digit, col) => (
					<View key={`top-${col}`} style={styles.headerCell}>
						<Text style={styles.headerText}>{digit}</Text>
					</View>
				))}
				<View style={styles.rightGutter} />
			</View>

			{solution.lattice.cells.map((row, rowIndex) => {
				const leftDiagonalIndex =
					problem.numPlaces + problem.multiplierPlaces - 1 - rowIndex;
				return (
					<View key={`row-${rowIndex}`} style={styles.gridRow}>
						<View style={styles.leftGutter}>
							<View style={styles.leftResultGuide} pointerEvents="none" />
							<View style={styles.leftResultInputWrap}>
								<LatticeInput
									value={work.diagonals[leftDiagonalIndex]?.answer ?? ""}
									status={work.diagonals[leftDiagonalIndex]?.status ?? "idle"}
									onChangeText={(digit) =>
										enterLatticeDiagonal(leftDiagonalIndex, digit)
									}
									testID={`lattice-diagonal-${leftDiagonalIndex}`}
									align="bottomLeft"
								/>
							</View>
						</View>
						{row.map((cell, colIndex) => {
							const cellWork = work.cells[rowIndex][colIndex];
							return (
								<LatticeCell
									key={`cell-${rowIndex}-${colIndex}`}
									tensValue={cellWork.tens.answer}
									tensStatus={cellWork.tens.status}
									onesValue={cellWork.ones.answer}
									onesStatus={cellWork.ones.status}
									onChangeTens={(digit) =>
										enterLatticeCell(rowIndex, colIndex, "tens", digit)
									}
									onChangeOnes={(digit) =>
										enterLatticeCell(rowIndex, colIndex, "ones", digit)
									}
									testIDPrefix={`lattice-cell-r${rowIndex}-c${colIndex}`}
								/>
							);
						})}
						<View style={styles.rightGutter}>
							<Text style={styles.headerText}>
								{multiplierDigits[rowIndex]}
							</Text>
						</View>
					</View>
				);
			})}

			<View style={styles.bottomRow}>
				<View style={styles.leftGutter} />
				{Array.from({ length: problem.numPlaces }, (_, col) => {
					const diagonalIndex = problem.numPlaces - 1 - col;
					return (
						<View key={`bottom-${col}`} style={styles.bottomCell}>
							<View style={styles.bottomResultGuide} pointerEvents="none" />
							<View style={styles.bottomResultInputWrap}>
								<LatticeInput
									value={work.diagonals[diagonalIndex]?.answer ?? ""}
									status={work.diagonals[diagonalIndex]?.status ?? "idle"}
									onChangeText={(digit) =>
										enterLatticeDiagonal(diagonalIndex, digit)
									}
									testID={`lattice-diagonal-${diagonalIndex}`}
									align="bottomLeft"
								/>
							</View>
						</View>
					);
				})}
				<View style={styles.rightGutter} />
			</View>

			{work.solved && (
				<View style={styles.banner} testID="lattice-success-banner">
					<Text style={styles.bannerText}>Correct!</Text>
				</View>
			)}
		</View>
	);
}

const TRIANGLE_INPUT_WIDTH = 48;
const TRIANGLE_INPUT_HEIGHT = 42;
const DIAGONAL_STROKE_WIDTH = 2;
const CELL_DIAGONAL_OVERHANG = 10;
const RESULT_DIAGONAL_LENGTH = 108;
const RESULT_INPUT_INSET = 8;

const styles = StyleSheet.create({
	container: {
		alignItems: "flex-start",
		gap: spacing.xs,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	gridRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	bottomRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	leftGutter: {
		width: LATTICE_CELL_SIZE,
		height: LATTICE_CELL_SIZE,
		position: "relative",
		overflow: "visible",
	},
	rightGutter: {
		width: LATTICE_CELL_SIZE,
		height: LATTICE_CELL_SIZE,
		alignItems: "center",
		justifyContent: "center",
	},
	headerCell: {
		width: LATTICE_CELL_SIZE,
		height: LATTICE_CELL_SIZE,
		alignItems: "center",
		justifyContent: "center",
	},
	bottomCell: {
		width: LATTICE_CELL_SIZE,
		height: LATTICE_CELL_SIZE,
		position: "relative",
		overflow: "visible",
	},
	headerText: {
		fontSize: typography.fontSize["2xl"],
		fontWeight: typography.fontWeight.semibold,
		color: colors.text,
		fontVariant: ["tabular-nums"],
	},
	cell: {
		width: LATTICE_CELL_SIZE,
		height: LATTICE_CELL_SIZE,
		borderWidth: 1,
		borderColor: colors.text,
		position: "relative",
		backgroundColor: colors.background,
	},
	diagonal: {
		position: "absolute",
		left: -CELL_DIAGONAL_OVERHANG / 2,
		top: LATTICE_CELL_SIZE / 2 - DIAGONAL_STROKE_WIDTH / 2,
		width: LATTICE_CELL_SIZE + CELL_DIAGONAL_OVERHANG,
		height: DIAGONAL_STROKE_WIDTH,
		backgroundColor: colors.text,
		transform: [{ rotate: "-45deg" }],
	},
	leftResultGuide: {
		position: "absolute",
		left: 16,
		top: 56,
		width: RESULT_DIAGONAL_LENGTH,
		height: DIAGONAL_STROKE_WIDTH,
		backgroundColor: colors.text,
		transform: [{ rotate: "-45deg" }],
	},
	bottomResultGuide: {
		position: "absolute",
		left: -10,
		top: 24,
		width: RESULT_DIAGONAL_LENGTH,
		height: DIAGONAL_STROKE_WIDTH,
		backgroundColor: colors.text,
		transform: [{ rotate: "-45deg" }],
	},
	leftResultInputWrap: {
		position: "absolute",
		left: RESULT_INPUT_INSET,
		bottom: RESULT_INPUT_INSET,
		width: TRIANGLE_INPUT_WIDTH,
		height: TRIANGLE_INPUT_HEIGHT,
	},
	bottomResultInputWrap: {
		position: "absolute",
		left: RESULT_INPUT_INSET,
		bottom: RESULT_INPUT_INSET,
		width: TRIANGLE_INPUT_WIDTH,
		height: TRIANGLE_INPUT_HEIGHT,
	},
	tensWrap: {
		position: "absolute",
		top: 6,
		left: 6,
		width: TRIANGLE_INPUT_WIDTH,
		height: TRIANGLE_INPUT_HEIGHT,
	},
	onesWrap: {
		position: "absolute",
		bottom: 6,
		right: 6,
		width: TRIANGLE_INPUT_WIDTH,
		height: TRIANGLE_INPUT_HEIGHT,
	},
	inputShell: {
		width: TRIANGLE_INPUT_WIDTH,
		height: TRIANGLE_INPUT_HEIGHT,
		borderWidth: 1,
		borderRadius: 6,
		position: "absolute",
		overflow: "hidden",
	},
	topLeftShell: {
		top: 0,
		left: 0,
	},
	bottomRightShell: {
		bottom: 0,
		right: 0,
	},
	bottomLeftShell: {
		bottom: 0,
		left: 0,
	},
	idleShell: {
		borderColor: colors.border,
		backgroundColor: colors.background,
	},
	correctShell: {
		borderColor: colors.success,
		backgroundColor: colors.successSurface,
	},
	incorrectShell: {
		borderColor: colors.error,
		backgroundColor: colors.errorSurface,
	},
	inputText: {
		width: "100%",
		height: "100%",
		padding: 0,
		fontSize: typography.fontSize["2xl"],
		lineHeight: 32,
		fontWeight: typography.fontWeight.semibold,
		fontVariant: ["tabular-nums"],
	},
	topLeftText: {
		textAlign: "center",
		paddingTop: 4,
	},
	bottomRightText: {
		textAlign: "center",
		paddingTop: 4,
	},
	bottomLeftText: {
		textAlign: "center",
		paddingTop: 4,
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
	banner: {
		marginTop: spacing.md,
		alignSelf: "center",
	},
	bannerText: {
		fontSize: typography.fontSize.xl,
		fontWeight: typography.fontWeight.bold,
		color: colors.success,
	},
});
