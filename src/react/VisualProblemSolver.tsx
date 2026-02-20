import { PLACES, type Place } from "@domain/addition";
import { canCarry as domainCanCarry } from "@domain/visual-addition";
import type { VisualZone } from "@domain/visual-addition";
import { TenFrame } from "@react/TenFrame";
import { useAdditionStore } from "@react/store";
import { colors, spacing, typography } from "@react/theme";
import { StyleSheet, Text, View } from "react-native";

const PLACE_COLORS: Record<Place | "overflow", string> = {
	ones_pl: colors.primary,
	tens_pl: "#2ecc71",
	hundreds_pl: "#e67e22",
	thousands_pl: "#9b59b6",
	overflow: "#e74c3c",
};

const PLACE_LABELS: Record<Place | "overflow", string> = {
	ones_pl: "1s",
	tens_pl: "10s",
	hundreds_pl: "100s",
	thousands_pl: "1,000s",
	overflow: "carry",
};

export function VisualProblemSolver() {
	const problem = useAdditionStore((s) => s.problem);
	const solution = useAdditionStore((s) => s.solution);
	const visualWork = useAdditionStore((s) => s.visualWork);
	const moveVisualDisk = useAdditionStore((s) => s.moveVisualDisk);
	const carryVisual = useAdditionStore((s) => s.carryVisual);

	const { numPlaces } = problem;
	const { activeColumn, solved, overflow } = visualWork;

	// Active places most-significant first for display
	const activePlaces = PLACES.slice(0, numPlaces).reverse() as Place[];
	const showOverflow = solution.finalCarryOut > 0 || overflow > 0;

	function renderColumn(
		placeKey: Place | "overflow",
		index: number,
		columnIndex: number,
	) {
		const isOverflow = placeKey === "overflow";
		const color = PLACE_COLORS[placeKey];
		const label = PLACE_LABELS[placeKey];

		if (isOverflow) {
			return (
				<View key="overflow" style={styles.column}>
					<Text style={styles.columnLabel}>{label}</Text>
					<View style={styles.overflowDisk}>
						<View
							style={[
								styles.overflowCircle,
								{ backgroundColor: overflow > 0 ? color : "transparent" },
							]}
						/>
					</View>
				</View>
			);
		}

		const place = placeKey as Place;
		const placeIndex = PLACES.indexOf(place);
		const isDone = placeIndex < activeColumn;
		const isActive = placeIndex === activeColumn;
		const isPending = placeIndex > activeColumn;
		const locked = isDone || isPending || solved;

		const col = visualWork.columns[place];
		const colSolved = solved || isDone;

		const topCanCarry = domainCanCarry(col, "top");
		const bottomCanCarry = domainCanCarry(col, "bottom");

		function handleDiskPointerDown(zone: VisualZone) {
			if (!locked) {
				moveVisualDisk(place, zone);
			}
		}

		return (
			<View
				key={place}
				style={[styles.column, isPending && styles.columnPending]}
			>
				<Text style={[styles.columnLabel, isDone && styles.labelDone]}>
					{label}
				</Text>
				<TenFrame
					count={col.top}
					color={color}
					solved={colSolved}
					locked={locked}
					canCarry={!locked && topCanCarry}
					onDiskPointerDown={() => handleDiskPointerDown("top")}
					onCarry={() => carryVisual(place, "top")}
					testID={`visual-zone-top-${place}`}
					carryBtnTestID={`visual-carry-btn-${place}-top`}
					diskTestIDPrefix={`visual-disk-top-${place}`}
				/>
				<View style={styles.zoneSep} />
				<TenFrame
					count={col.bottom}
					color={color}
					solved={colSolved}
					locked={locked}
					canCarry={!locked && bottomCanCarry}
					onDiskPointerDown={() => handleDiskPointerDown("bottom")}
					onCarry={() => carryVisual(place, "bottom")}
					testID={`visual-zone-bottom-${place}`}
					carryBtnTestID={`visual-carry-btn-${place}-bottom`}
					diskTestIDPrefix={`visual-disk-bottom-${place}`}
				/>
			</View>
		);
	}

	return (
		<View
			style={styles.container}
			// @ts-ignore — web-only
			data-testid="visual-problem-solver"
			testID="visual-problem-solver"
		>
			<View style={styles.columnsRow}>
				{showOverflow && renderColumn("overflow", -1, -1)}
				{activePlaces.map((place, displayIdx) =>
					renderColumn(place, displayIdx, numPlaces - 1 - displayIdx),
				)}
			</View>

			{solved && (
				<View style={styles.banner}>
					<Text
						style={styles.bannerText}
						// @ts-ignore — web-only
						data-testid="visual-correct-banner"
						testID="visual-correct-banner"
					>
						Correct!
					</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		gap: spacing.md,
	},
	columnsRow: {
		flexDirection: "row",
		gap: spacing.md,
		alignItems: "flex-start",
	},
	column: {
		alignItems: "center",
		gap: spacing.xs,
	},
	columnPending: {
		opacity: 0.4,
	},
	columnLabel: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
		color: colors.textMuted,
	},
	labelDone: {
		color: colors.success,
	},
	zoneSep: {
		height: 8,
	},
	overflowDisk: {
		width: 44,
		height: 44,
		alignItems: "center",
		justifyContent: "center",
	},
	overflowCircle: {
		width: 32,
		height: 32,
		borderRadius: 16,
		borderWidth: 2,
		borderColor: PLACE_COLORS.overflow,
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
