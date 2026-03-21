import { PLACES } from "@domain/addition";
import { CELL_SIZE, DigitCell } from "@react/DigitCell";
import { type CellStatus, useAdditionStore } from "@react/store";
import { colors, typography } from "@react/theme";
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

// Renders an answer-input cell with testID on the <TextInput> element so that
// Playwright's locator.fill() resolves to the actual <input> in the web DOM.
// Cells remain editable even after the status turns "correct" so that the e2e
// brute-force loop can keep overwriting entries without hitting a readonly
// barrier — the solved flag (owned by the store) does not regress when an
// already-correct cell is overwritten with an incorrect value.
function AnswerInputCell({
	value,
	status,
	locked,
	onChangeText,
	testID,
}: {
	value: string;
	status: CellStatus;
	locked: boolean;
	onChangeText: (d: string) => void;
	testID: string;
}) {
	// Keep editable as long as the cell is not locked; ignore status=correct so
	// that Playwright's fill() never hits a readonly element mid-loop.
	const editable = !locked;
	const cellStyle = [
		answerStyles.cell,
		locked
			? answerStyles.lockedCell
			: status === "correct"
				? answerStyles.correctCell
				: status === "incorrect"
					? answerStyles.incorrectCell
					: answerStyles.idleCell,
	];
	const textStyle = [
		answerStyles.input,
		locked
			? answerStyles.lockedText
			: status === "correct"
				? answerStyles.correctText
				: status === "incorrect"
					? answerStyles.incorrectText
					: answerStyles.idleText,
	];
	return (
		<View style={cellStyle}>
			<TextInput
				value={value}
				onChangeText={(t) => {
					if (t === "") {
						onChangeText("");
						return;
					}
					const digits = t.replace(/\D/g, "").slice(-1);
					if (digits.length > 0) onChangeText(digits);
				}}
				editable={editable}
				maxLength={1}
				selectTextOnFocus
				keyboardType="numeric"
				style={textStyle}
				testID={testID}
			/>
		</View>
	);
}

const answerStyles = StyleSheet.create({
	cell: {
		width: CELL_SIZE,
		height: CELL_SIZE,
		alignItems: "center",
		justifyContent: "center",
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
		padding: 0,
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
		color: colors.text,
	},
});

export function MultiplicationProblemSolver() {
	const problem = useAdditionStore((s) => s.multiplicationProblem);
	const solution = useAdditionStore((s) => s.multiplicationSolution);
	const work = useAdditionStore((s) => s.multiplicationWork);
	const finalSumWork = useAdditionStore((s) => s.finalSumWork);
	const enterAnswer = useAdditionStore((s) => s.enterMultiplicationAnswer);
	const enterCarry = useAdditionStore((s) => s.enterMultiplicationCarry);
	const enterFinalCarry = useAdditionStore(
		(s) => s.enterMultiplicationFinalCarry,
	);
	const enterFinalSum = useAdditionStore((s) => s.enterMultiplicationFinalSum);
	const enterFinalAdditionCarry = useAdditionStore(
		(s) => s.enterMultiplicationFinalAdditionCarry,
	);
	const enterFinalSumOverflow = useAdditionStore(
		(s) => s.enterMultiplicationFinalSumOverflow,
	);

	const { multiplicand, multiplier, numPlaces, multiplierPlaces } = problem;
	const { rows, activeRow, solved } = work;

	// Total display width: ones column through the highest shifted partial product
	const displayWidth = numPlaces + multiplierPlaces - 1;
	const rowWidth = (displayWidth + 1) * CELL_SIZE;
	// Most-significant first for rendering
	const displayPlaces = PLACES.slice(0, displayWidth).reverse();

	// Zip rows with their partial products using shift as a stable React key.
	const rowData = solution.partialProducts.map((partialProduct, rowIdx) => ({
		partialProduct,
		rowWork: rows[rowIdx],
		rowIdx,
	}));

	const partialProductsSolved = rows.every((r) => r.solved);

	const { overflow } = solution.finalResult;

	return (
		<View
			style={styles.table}
			// @ts-ignore — web-only
			data-testid="multiplication-problem-solver"
			testID="multiplication-problem-solver"
		>
			{/* Carry rows above problem — highest shift on top, ones row closest to multiplicand */}
			{[...rowData].reverse().map(({ partialProduct, rowWork, rowIdx }) => {
				const locked = rowIdx !== activeRow;
				return (
					<View
						key={`carry-row-${rowIdx}`}
						style={[styles.row, { width: rowWidth }]}
						testID={`carry-row-${rowIdx}`}
					>
						{/* Left overflow spacer */}
						<DigitCell mode="empty" />
						{displayPlaces.map((displayPlace, displayIdx) => {
							const carrySourceIndex = displayWidth - 2 - rowIdx - displayIdx;
							if (carrySourceIndex < 0 || carrySourceIndex >= numPlaces) {
								return (
									<DigitCell
										key={displayPlace}
										mode="empty"
										testID={`carry-empty-row${rowIdx}-${displayPlace}`}
									/>
								);
							}
							const carrySourcePlace = PLACES[carrySourceIndex];
							const entry = rowWork.entries[carrySourcePlace];
							if (locked) {
								return (
									<DigitCell
										key={displayPlace}
										mode="empty"
										testID={`carry-input-row${rowIdx}-${carrySourcePlace}`}
									/>
								);
							}
							const receivingColumnIndex = carrySourceIndex + 1;
							const isLeadingCarry = receivingColumnIndex >= numPlaces;
							if (isLeadingCarry) {
								return (
									<DigitCell
										key={displayPlace}
										mode="empty"
										testID={`carry-empty-row${rowIdx}-${displayPlace}`}
									/>
								);
							}
							const attention =
								rowWork.entries[PLACES[receivingColumnIndex]].answerStatus ===
									"incorrect" &&
								partialProduct.columns[carrySourcePlace].carryOut > 0;
							return (
								<DigitCell
									key={displayPlace}
									mode="input"
									value={entry.carry}
									status={entry.carryStatus}
									locked={false}
									attention={attention}
									onChangeText={(d) => enterCarry(carrySourcePlace, d)}
									testID={`carry-input-row${rowIdx}-${carrySourcePlace}`}
								/>
							);
						})}
					</View>
				);
			})}

			{/* Multiplicand row — right-aligned in display width */}
			<View style={[styles.row, { width: rowWidth }]}>
				{/* Left overflow spacer */}
				<DigitCell mode="empty" />
				{displayPlaces.map((displayPlace, displayIdx) => {
					const placeIndex = displayWidth - 1 - displayIdx;
					if (placeIndex < 0 || placeIndex >= numPlaces) {
						return (
							<DigitCell
								key={displayPlace}
								mode="empty"
								testID={`multiplicand-empty-${displayPlace}`}
							/>
						);
					}
					const place = PLACES[placeIndex];
					return (
						<DigitCell
							key={displayPlace}
							mode="static"
							value={String(multiplicand[place])}
							testID={`multiplicand-${place}`}
						/>
					);
				})}
			</View>

			{/* Multiplier row — right-aligned in display width, with × symbol */}
			<View style={[styles.row, { width: rowWidth }]}>
				{/* × symbol in the leftmost overflow slot */}
				<DigitCell mode="static" value="×" testID="multiplier-symbol" />
				{displayPlaces.map((displayPlace, displayIdx) => {
					const digitIndex = displayWidth - 1 - displayIdx;
					if (digitIndex < 0 || digitIndex >= multiplierPlaces) {
						return (
							<DigitCell
								key={displayPlace}
								mode="empty"
								testID={`multiplier-empty-${displayPlace}`}
							/>
						);
					}
					const multiplierDigit =
						Math.floor(multiplier / 10 ** digitIndex) % 10;
					return (
						<DigitCell
							key={displayPlace}
							mode="static"
							value={String(multiplierDigit)}
							testID={
								digitIndex === 0
									? "multiplier"
									: `multiplier-digit-${digitIndex}`
							}
						/>
					);
				})}
			</View>

			{/* Divider 1 */}
			<View
				style={[styles.divider, { width: (displayWidth + 1) * CELL_SIZE }]}
			/>

			{/* Final-addition carry row (only shown when multiplierPlaces > 1) */}
			{multiplierPlaces > 1 && (
				<View
					style={[styles.row, { width: rowWidth }]}
					testID="final-addition-carry-row"
				>
					<DigitCell mode="empty" />
					{displayPlaces.map((displayPlace) => {
						const carryIn = solution.finalAdditionCarryIns[displayPlace];
						if (carryIn === undefined) {
							return <DigitCell key={displayPlace} mode="empty" />;
						}
						if (!partialProductsSolved) {
							return (
								<DigitCell
									key={displayPlace}
									mode="empty"
									testID={`final-addition-carry-${displayPlace}`}
								/>
							);
						}
						const entry = finalSumWork.additionCarryEntries[displayPlace];
						return (
							<DigitCell
								key={displayPlace}
								mode="input"
								value={entry?.answer ?? ""}
								status={entry?.status ?? "idle"}
								locked={false}
								onChangeText={(d) => enterFinalAdditionCarry(displayPlace, d)}
								testID={`final-addition-carry-${displayPlace}`}
							/>
						);
					})}
				</View>
			)}

			{/* Answer rows — ones partial product closest to divider 1 */}
			{rowData.map(({ partialProduct, rowWork, rowIdx }) => {
				const shift = partialProduct.shift;
				const locked = rowIdx !== activeRow;
				const finalCarryColumnIndex = numPlaces + shift;
				const overflowFinalCarry = finalCarryColumnIndex >= displayWidth;
				const finalCarryLocked =
					locked ||
					partialProduct.finalCarryOut === 0 ||
					rowWork.unlockedUpTo < numPlaces;

				return (
					<React.Fragment key={`shift${shift}`}>
						{/* Answer row */}
						<View
							style={[styles.row, { width: rowWidth }]}
							testID={`answer-row-${rowIdx}`}
						>
							{/* Leftmost cell: finalCarry overflow or empty */}
							{overflowFinalCarry ? (
								<DigitCell
									mode="input"
									value={rowWork.finalCarry}
									status={rowWork.finalCarryStatus}
									locked={finalCarryLocked}
									onChangeText={enterFinalCarry}
									testID={`answer-row-${rowIdx}-finalcarry`}
								/>
							) : (
								<DigitCell mode="empty" />
							)}
							{displayPlaces.map((displayPlace, displayIdx) => {
								const placeIndex = displayWidth - 1 - displayIdx;

								// finalCarry in-grid placement
								if (
									placeIndex === finalCarryColumnIndex &&
									!overflowFinalCarry
								) {
									return (
										<DigitCell
											key={displayPlace}
											mode="input"
											value={rowWork.finalCarry}
											status={rowWork.finalCarryStatus}
											locked={finalCarryLocked}
											onChangeText={enterFinalCarry}
											testID={`answer-row-${rowIdx}-finalcarry`}
										/>
									);
								}

								// Answer digit placement (staircase shift)
								if (placeIndex >= shift && placeIndex < numPlaces + shift) {
									const effectivePlaceIndex = placeIndex - shift;
									const place = PLACES[effectivePlaceIndex];
									const entry = rowWork.entries[place];
									const cellLocked =
										locked || effectivePlaceIndex > rowWork.unlockedUpTo;
									return (
										<AnswerInputCell
											key={displayPlace}
											value={entry.answer}
											status={entry.answerStatus}
											locked={cellLocked}
											onChangeText={(d) => enterAnswer(place, d)}
											testID={`answer-row-${rowIdx}-${displayPlace}`}
										/>
									);
								}

								return (
									<DigitCell
										key={displayPlace}
										mode="empty"
										testID={`answer-row-${rowIdx}-${displayPlace}-empty`}
									/>
								);
							})}
						</View>
					</React.Fragment>
				);
			})}

			{/* Divider 2 */}
			<View
				style={[styles.divider, { width: (displayWidth + 1) * CELL_SIZE }]}
			/>

			{/* Final sum row — always visible; cells locked until partial products solved */}
			<View
				style={[styles.row, { width: rowWidth }]}
				testID="final-sum-row"
			>
				{/* Leftmost cell: overflow input or empty spacer */}
				{overflow !== 0 ? (
					<AnswerInputCell
						value={finalSumWork.overflowAnswer}
						status={finalSumWork.overflowStatus}
						locked={!partialProductsSolved}
						onChangeText={(d) => enterFinalSumOverflow(d)}
						testID="final-result-overflow"
					/>
				) : (
					<DigitCell mode="empty" testID="final-result-overflow-empty" />
				)}
				{displayPlaces.map((displayPlace) => {
					const placeIndex = PLACES.indexOf(displayPlace);
					const entry = finalSumWork.entries[displayPlace];
					const cellLocked =
						!partialProductsSolved || placeIndex > finalSumWork.unlockedUpTo;
					return (
						<AnswerInputCell
							key={displayPlace}
							value={entry?.answer ?? ""}
							status={entry?.status ?? "idle"}
							locked={cellLocked}
							onChangeText={(d) => enterFinalSum(displayPlace, d)}
							testID={`final-sum-${displayPlace}`}
						/>
					);
				})}
			</View>

			{/* Success banner */}
			{solved && (
				<View style={styles.banner} testID="success-banner">
					<Text style={styles.bannerText}>Correct!</Text>
				</View>
			)}
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
	divider: {
		borderTopWidth: 2,
		borderTopColor: colors.text,
		marginVertical: 4,
	},
	banner: {
		marginTop: 16,
		alignSelf: "center",
	},
	bannerText: {
		fontSize: typography.fontSize.xl,
		fontWeight: typography.fontWeight.bold,
		color: colors.success,
	},
});
