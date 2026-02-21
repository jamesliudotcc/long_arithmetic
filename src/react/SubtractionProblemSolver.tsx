import { PLACES } from "@domain/addition";
import { CELL_SIZE, DigitCell } from "@react/DigitCell";
import { useAdditionStore } from "@react/store";
import { colors, spacing, typography } from "@react/theme";
import { StyleSheet, Text, View } from "react-native";

export function SubtractionProblemSolver() {
	const problem = useAdditionStore((s) => s.subtractionProblem);
	const solution = useAdditionStore((s) => s.subtractionSolution);
	const work = useAdditionStore((s) => s.subtractionWork);
	const enterAnswer = useAdditionStore((s) => s.enterSubtractionAnswer);
	const enterBorrow = useAdditionStore((s) => s.enterSubtractionBorrow);
	const enterEffectiveValue = useAdditionStore(
		(s) => s.enterSubtractionEffectiveValue,
	);

	const { minuend, subtrahend, numPlaces } = problem;
	const { solved } = work;

	// Most-significant first
	const displayPlaces = PLACES.slice(0, numPlaces).reverse();

	return (
		<View
			style={styles.table}
			// @ts-ignore — web-only
			data-testid="subtraction-problem-solver"
			testID="subtraction-problem-solver"
		>
			{/* Upper scratch row: effectiveTop+10 above each column being worked */}
			<View style={styles.row}>
				<DigitCell mode="empty" testID="upper-scratch-extra-empty" />
				{displayPlaces.map((place) => {
					const index = PLACES.indexOf(place);
					// Future columns: stay blank so the student doesn't know what's coming
					if (!solved && index > work.unlockedUpTo) {
						return (
							<DigitCell
								key={place}
								mode="empty"
								testID={`effective-input-${place}`}
							/>
						);
					}
					const entry = work.entries[place];
					// Only the current column is unlocked; past and solved are locked
					const locked = solved || index !== work.unlockedUpTo;
					return (
						<DigitCell
							key={place}
							mode="input"
							value={entry.effectiveValue}
							status={entry.effectiveValueStatus}
							locked={locked}
							maxLength={2}
							onChangeText={(d) => enterEffectiveValue(place, d)}
							testID={`effective-input-${place}`}
						/>
					);
				})}
			</View>

			{/* Lower scratch row: reduced minuend above the borrowed-from column */}
			<View style={styles.row}>
				<DigitCell mode="empty" testID="scratch-extra-empty" />
				{displayPlaces.map((place, displayIdx) => {
					// sourceIndex is the borrowing column's index; its borrow scratch
					// is displayed one cell to the left (above the borrowed-from column).
					const sourceIndex = numPlaces - 2 - displayIdx;
					if (sourceIndex < 0) {
						// Ones display slot — nothing below ones can borrow
						return (
							<DigitCell
								key={place}
								mode="empty"
								testID={`borrow-input-${place}`}
							/>
						);
					}
					const borrowedFromPlace = PLACES[sourceIndex + 1];
					// Future steps: stay blank
					if (!solved && sourceIndex > work.unlockedUpTo) {
						return (
							<DigitCell
								key={place}
								mode="empty"
								testID={`borrow-input-${borrowedFromPlace}`}
							/>
						);
					}
					const entry = work.entries[borrowedFromPlace];
					const locked = solved || sourceIndex !== work.unlockedUpTo;
					return (
						<DigitCell
							key={place}
							mode="input"
							value={entry.borrow}
							status={entry.borrowStatus}
							locked={locked}
							onChangeText={(d) => enterBorrow(borrowedFromPlace, d)}
							testID={`borrow-input-${borrowedFromPlace}`}
						/>
					);
				})}
			</View>

			{/* Minuend row */}
			<View style={styles.row}>
				<DigitCell mode="empty" />
				{displayPlaces.map((place) => (
					<DigitCell
						key={place}
						mode="static"
						value={String(minuend[place])}
						testID={`minuend-${place}`}
					/>
				))}
			</View>

			{/* Subtrahend row */}
			<View style={styles.row}>
				<DigitCell mode="static" value="−" testID="operator" />
				{displayPlaces.map((place) => (
					<DigitCell
						key={place}
						mode="static"
						value={String(subtrahend[place])}
						testID={`subtrahend-${place}`}
					/>
				))}
			</View>

			{/* Divider */}
			<View style={[styles.divider, { width: (numPlaces + 1) * CELL_SIZE }]} />

			{/* Answer row */}
			<View style={styles.row}>
				<DigitCell mode="empty" />
				{displayPlaces.map((place) => {
					const index = PLACES.indexOf(place);
					const locked = solved || index > work.unlockedUpTo;
					const entry = work.entries[place];
					return (
						<DigitCell
							key={place}
							mode="input"
							value={entry.answer}
							status={entry.answerStatus}
							locked={locked}
							onChangeText={(d) => enterAnswer(place, d)}
							testID={`answer-input-${place}`}
						/>
					);
				})}
			</View>

			{/* Success banner */}
			{work.solved && (
				<View style={styles.banner}>
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
		marginVertical: spacing.xs,
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
