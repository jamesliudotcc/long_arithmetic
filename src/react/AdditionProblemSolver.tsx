import { PLACES } from "@domain/addition";
import { CELL_SIZE, DigitCell } from "@react/DigitCell";
import { useAdditionStore } from "@react/store";
import { colors, spacing, typography } from "@react/theme";
import { StyleSheet, Text, View } from "react-native";

export function AdditionProblemSolver() {
	const problem = useAdditionStore((s) => s.problem);
	const solution = useAdditionStore((s) => s.solution);
	const work = useAdditionStore((s) => s.work);
	const enterAnswer = useAdditionStore((s) => s.enterAnswer);
	const enterCarry = useAdditionStore((s) => s.enterCarry);
	const enterFinalCarry = useAdditionStore((s) => s.enterFinalCarry);

	const { addend1, addend2, numPlaces } = problem;
	const { finalCarryOut } = solution;
	const { solved } = work;

	// Most-significant first (matches AdditionProblemDisplay)
	const displayPlaces = PLACES.slice(0, numPlaces).reverse();

	return (
		<View style={styles.table}>
			{/* Scratch row: carry-out inputs — always shown so the student decides */}
			<View style={styles.row}>
				<DigitCell mode="empty" testID="scratch-extra-empty" />
				{displayPlaces.map((displayPlace, displayIdx) => {
					// sourceIndex: the PLACES index whose carryOut is shown in this slot
					// carry-out of column X is displayed above column X+1 (one to the left in display)
					const sourceIndex = numPlaces - 2 - displayIdx;
					if (sourceIndex < 0) {
						// ones column slot → no column below, always empty
						return (
							<DigitCell
								key={displayPlace}
								mode="empty"
								testID={`scratch-empty-${displayPlace}`}
							/>
						);
					}
					const sourcePlace = PLACES[sourceIndex];
					const entry = work.entries[sourcePlace];
					const locked = solved || sourceIndex > work.unlockedUpTo;
					return (
						<DigitCell
							key={displayPlace}
							mode="input"
							value={entry.carry}
							status={entry.carryStatus}
							locked={locked}
							onChangeText={(d) => enterCarry(sourcePlace, d)}
							testID={`carry-input-${sourcePlace}`}
						/>
					);
				})}
			</View>

			{/* Addend 1 row */}
			<View style={styles.row}>
				<DigitCell mode="empty" />
				{displayPlaces.map((place) => (
					<DigitCell
						key={place}
						mode="static"
						value={String(addend1[place])}
						testID={`addend1-${place}`}
					/>
				))}
			</View>

			{/* Addend 2 row */}
			<View style={styles.row}>
				<DigitCell mode="static" value="+" testID="operator" />
				{displayPlaces.map((place) => (
					<DigitCell
						key={place}
						mode="static"
						value={String(addend2[place])}
						testID={`addend2-${place}`}
					/>
				))}
			</View>

			{/* Divider */}
			<View style={[styles.divider, { width: (numPlaces + 1) * CELL_SIZE }]} />

			{/* Answer row */}
			<View style={styles.row}>
				{/* Extra left column: only interactive when there is an overflow carry */}
				<DigitCell
					mode="input"
					value={work.finalCarry}
					status={work.finalCarryStatus}
					locked={
						solved || finalCarryOut === 0 || work.unlockedUpTo < numPlaces
					}
					onChangeText={enterFinalCarry}
					testID="final-carry-answer"
				/>
				{displayPlaces.map((place, displayIdx) => {
					const index = numPlaces - 1 - displayIdx;
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
