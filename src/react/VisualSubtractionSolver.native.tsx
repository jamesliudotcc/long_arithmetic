import { PLACES, type Place } from "@domain/addition";
import {
	canBorrowFrom as domainCanBorrowFrom,
	canCancelSub as domainCanCancelSub,
} from "@domain/visual-subtraction";
import { PlaceDiscs } from "@react/PlaceDiscs";
import { useAdditionStore } from "@react/store";
import { colors, radius, spacing, typography } from "@react/theme";
import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const PLACE_COLORS: Record<Place, string> = {
	ones_pl: colors.primary,
	tens_pl: "#2ecc71",
	hundreds_pl: "#e67e22",
	thousands_pl: "#9b59b6",
};

const PLACE_DENOMINATIONS: Record<Place, string> = {
	ones_pl: "1",
	tens_pl: "10",
	hundreds_pl: "100",
	thousands_pl: "1k",
};

const PLACE_LABELS: Record<Place, string> = {
	ones_pl: "1s",
	tens_pl: "10s",
	hundreds_pl: "100s",
	thousands_pl: "1,000s",
};

type ColumnLayout = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export function VisualSubtractionSolver() {
	const subtractionProblem = useAdditionStore((s) => s.subtractionProblem);
	const visualSubWork = useAdditionStore((s) => s.visualSubWork);
	const cancelVisualSub = useAdditionStore((s) => s.cancelVisualSub);
	const moveBorrowDownVisualSub = useAdditionStore(
		(s) => s.moveBorrowDownVisualSub,
	);
	const borrowVisualSub = useAdditionStore((s) => s.borrowVisualSub);

	const { numPlaces } = subtractionProblem;
	const { activeColumn, solved } = visualSubWork;

	const [draggingFrom, setDraggingFrom] = useState<Place | null>(null);

	// Track column layouts relative to the columnsRow container
	const columnLayouts = useRef<Map<Place, ColumnLayout>>(new Map());
	const containerOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
	const columnsRowRef = useRef<View>(null);

	// Most-significant first for display
	const activePlaces = PLACES.slice(0, numPlaces).reverse() as Place[];

	function handleDrop(targetBorrowPlace: Place) {
		if (!draggingFrom) return;
		const sourceIdx = PLACES.indexOf(draggingFrom);
		const targetIdx = PLACES.indexOf(targetBorrowPlace);
		// Valid drop: target is exactly one place below source
		if (targetIdx === sourceIdx - 1) {
			borrowVisualSub(draggingFrom);
		}
		setDraggingFrom(null);
	}

	function handleDropByCoords(absoluteX: number, absoluteY: number) {
		if (!draggingFrom) return;
		const relX = absoluteX - containerOffset.current.x;
		const relY = absoluteY - containerOffset.current.y;

		for (const [placeKey, layout] of columnLayouts.current.entries()) {
			if (
				relX >= layout.x &&
				relX <= layout.x + layout.width &&
				relY >= layout.y &&
				relY <= layout.y + layout.height
			) {
				handleDrop(placeKey);
				return;
			}
		}
		setDraggingFrom(null);
	}

	function renderColumn(place: Place) {
		const placeIndex = PLACES.indexOf(place);
		const isDone = placeIndex < activeColumn;
		const isActive = placeIndex === activeColumn;
		const isNextColumn = placeIndex === activeColumn + 1;
		const dimmed = !solved && !isDone && !isActive && !isNextColumn;
		const colSolved = solved || isDone;

		const col = visualSubWork.columns[place];
		const color = PLACE_COLORS[place];
		const label = PLACE_LABELS[place];

		const canLend = isNextColumn && domainCanBorrowFrom(col);
		const canCancel = isActive && domainCanCancelSub(col);
		const isBorrowTarget =
			isActive && draggingFrom === PLACES[activeColumn + 1];

		const minuendPanGesture = Gesture.Pan()
			.runOnJS(true)
			.onBegin(() => {
				if (isNextColumn && canLend) {
					setDraggingFrom(place);
				}
			})
			.onEnd((e) => {
				handleDropByCoords(e.absoluteX, e.absoluteY);
			})
			.onFinalize(() => {
				setDraggingFrom(null);
			});

		return (
			<View
				key={place}
				style={[
					styles.column,
					dimmed && styles.columnPending,
					isBorrowTarget && styles.columnDropTarget,
				]}
				// @ts-ignore — web-only
				data-testid={`visual-sub-column-${place}`}
				testID={`visual-sub-column-${place}`}
				onLayout={(e) => {
					columnLayouts.current.set(place, e.nativeEvent.layout);
				}}
			>
				<Text style={[styles.columnLabel, isDone && styles.labelDone]}>
					{label}
				</Text>

				{/* Borrow zone — receives discs dragged from the next column */}
				<PlaceDiscs
					count={col.borrow}
					denomination={PLACE_DENOMINATIONS[place]}
					color={color}
					solved={colSolved}
					locked={!isActive}
					canCarry={false}
					onDiskPointerDown={
						isActive ? () => moveBorrowDownVisualSub(place) : undefined
					}
					testID={`visual-sub-borrow-${place}`}
					diskTestIDPrefix={`visual-sub-borrow-disk-${place}`}
				/>

				<View style={styles.zoneSep} />

				{/* Minuend zone — click to cancel, or drag source for borrowing */}
				<GestureDetector gesture={minuendPanGesture}>
					<View>
						<PlaceDiscs
							count={col.minuend}
							denomination={PLACE_DENOMINATIONS[place]}
							color={color}
							solved={colSolved}
							locked={(!isActive && !isNextColumn) || (isActive && !canCancel)}
							canCarry={canLend}
							isDragSource={draggingFrom === place}
							onDiskPointerDown={
								canCancel ? () => cancelVisualSub(place) : undefined
							}
							testID={`visual-sub-minuend-${place}`}
							diskTestIDPrefix={`visual-sub-minuend-disk-${place}`}
						/>
					</View>
				</GestureDetector>

				<View style={styles.zoneSep} />

				{/* Subtrahend zone — display only, locked */}
				<PlaceDiscs
					count={col.subtrahend}
					denomination={PLACE_DENOMINATIONS[place]}
					color={color}
					solved={colSolved}
					locked={!canCancel}
					canCarry={false}
					onDiskPointerDown={
						canCancel ? () => cancelVisualSub(place) : undefined
					}
					testID={`visual-sub-subtrahend-${place}`}
					diskTestIDPrefix={`visual-sub-subtrahend-disk-${place}`}
				/>
			</View>
		);
	}

	return (
		<View
			style={styles.container}
			// @ts-ignore — web-only
			data-testid="visual-sub-solver"
			testID="visual-sub-solver"
		>
			<View
				ref={columnsRowRef}
				style={styles.columnsRow}
				onLayout={() => {
					columnsRowRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
						containerOffset.current = { x: pageX, y: pageY };
					});
				}}
			>
				{activePlaces.map((place) => renderColumn(place))}
			</View>

			<View style={styles.banner}>
				<Text
					style={[styles.bannerText, !solved && styles.bannerHidden]}
					// @ts-ignore — web-only
					data-testid="visual-sub-correct-banner"
					testID="visual-sub-correct-banner"
				>
					Correct!
				</Text>
			</View>
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
		gap: spacing.xl,
		alignItems: "flex-start",
	},
	column: {
		alignItems: "center",
		gap: spacing.xs,
	},
	columnPending: {
		opacity: 0.4,
	},
	columnDropTarget: {
		opacity: 1,
		borderWidth: 2,
		borderColor: "#f39c12",
		borderStyle: "dashed",
		borderRadius: 8,
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
		height: spacing.md,
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
	bannerHidden: {
		opacity: 0,
	},
});
