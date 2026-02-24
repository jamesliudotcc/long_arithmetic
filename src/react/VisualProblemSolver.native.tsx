import { PLACES, type Place } from "@domain/addition";
import { canCarry as domainCanCarry } from "@domain/visual-addition";
import type { VisualZone } from "@domain/visual-addition";
import { PlaceDiscs } from "@react/PlaceDiscs";
import { useAdditionStore } from "@react/store";
import { colors, spacing, typography } from "@react/theme";
import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const PLACE_COLORS: Record<Place | "overflow", string> = {
	ones_pl: colors.primary,
	tens_pl: "#2ecc71",
	hundreds_pl: "#e67e22",
	thousands_pl: "#9b59b6",
	overflow: "#e74c3c",
};

const PLACE_DENOMINATIONS: Record<Place | "overflow", string> = {
	ones_pl: "1",
	tens_pl: "10",
	hundreds_pl: "100",
	thousands_pl: "1k",
	overflow: "10k",
};

const PLACE_LABELS: Record<Place | "overflow", string> = {
	ones_pl: "1s",
	tens_pl: "10s",
	hundreds_pl: "100s",
	thousands_pl: "1,000s",
	overflow: "carry",
};

type ColumnLayout = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export function VisualProblemSolver() {
	const problem = useAdditionStore((s) => s.problem);
	const solution = useAdditionStore((s) => s.solution);
	const visualWork = useAdditionStore((s) => s.visualWork);
	const moveVisualDisk = useAdditionStore((s) => s.moveVisualDisk);
	const carryVisual = useAdditionStore((s) => s.carryVisual);

	const { numPlaces } = problem;
	const { activeColumn, solved, overflow } = visualWork;

	const [draggingFrom, setDraggingFrom] = useState<{
		place: Place;
		zone: VisualZone;
	} | null>(null);

	// Track column layouts relative to the columnsRow container
	const columnLayouts = useRef<Map<Place | "overflow", ColumnLayout>>(
		new Map(),
	);
	const containerOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
	const columnsRowRef = useRef<View>(null);

	// Active places most-significant first for display
	const activePlaces = PLACES.slice(0, numPlaces).reverse() as Place[];
	const showOverflow = solution.finalCarryOut > 0 || overflow > 0;

	function handleDrop(targetPlace: Place | "overflow") {
		if (!draggingFrom) return;
		const sourceIdx = PLACES.indexOf(draggingFrom.place);
		const targetIdx =
			targetPlace === "overflow" ? PLACES.length : PLACES.indexOf(targetPlace);
		if (targetIdx === sourceIdx + 1) {
			carryVisual(draggingFrom.place, draggingFrom.zone);
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

	function isDropTarget(placeKey: Place | "overflow"): boolean {
		if (!draggingFrom) return false;
		const sourceIdx = PLACES.indexOf(draggingFrom.place);
		const targetIdx =
			placeKey === "overflow" ? PLACES.length : PLACES.indexOf(placeKey);
		return targetIdx === sourceIdx + 1;
	}

	function renderColumn(placeKey: Place | "overflow") {
		const isOverflow = placeKey === "overflow";
		const color = PLACE_COLORS[placeKey];
		const label = PLACE_LABELS[placeKey];
		const dropTarget = isDropTarget(placeKey);

		if (isOverflow) {
			return (
				<View
					key="overflow"
					style={[styles.column, dropTarget && styles.columnDropTarget]}
					// @ts-ignore — web-only
					data-testid="visual-column-overflow"
					testID="visual-column-overflow"
					onLayout={(e) => {
						columnLayouts.current.set("overflow", e.nativeEvent.layout);
					}}
				>
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

		function handleDiskPress(zone: VisualZone) {
			if (!locked) {
				moveVisualDisk(place, zone);
			}
		}

		const topPanGesture = Gesture.Pan()
			.runOnJS(true)
			.onBegin(() => {
				if (!locked && topCanCarry) {
					setDraggingFrom({ place, zone: "top" });
				}
			})
			.onEnd((e) => {
				handleDropByCoords(e.absoluteX, e.absoluteY);
			})
			.onFinalize(() => {
				setDraggingFrom(null);
			});

		const bottomPanGesture = Gesture.Pan()
			.runOnJS(true)
			.onBegin(() => {
				if (!locked && bottomCanCarry) {
					setDraggingFrom({ place, zone: "bottom" });
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
					isPending && styles.columnPending,
					dropTarget && styles.columnDropTarget,
				]}
				// @ts-ignore — web-only
				data-testid={`visual-column-${place}`}
				testID={`visual-column-${place}`}
				onLayout={(e) => {
					columnLayouts.current.set(place, e.nativeEvent.layout);
				}}
			>
				<Text style={[styles.columnLabel, isDone && styles.labelDone]}>
					{label}
				</Text>
				<GestureDetector gesture={topPanGesture}>
					<View>
						<PlaceDiscs
							count={col.top}
							denomination={PLACE_DENOMINATIONS[place]}
							color={color}
							solved={colSolved}
							locked={locked}
							canCarry={!locked && topCanCarry}
							isDragSource={
								draggingFrom?.place === place && draggingFrom?.zone === "top"
							}
							testID={`visual-zone-top-${place}`}
							diskTestIDPrefix={`visual-disk-top-${place}`}
						/>
					</View>
				</GestureDetector>
				<View style={styles.zoneSep} />
				<GestureDetector gesture={bottomPanGesture}>
					<View>
						<PlaceDiscs
							count={col.bottom}
							denomination={PLACE_DENOMINATIONS[place]}
							color={color}
							solved={colSolved}
							locked={locked}
							canCarry={!locked && bottomCanCarry}
							isDragSource={
								draggingFrom?.place === place && draggingFrom?.zone === "bottom"
							}
							onDiskPointerDown={() => handleDiskPress("bottom")}
							testID={`visual-zone-bottom-${place}`}
							diskTestIDPrefix={`visual-disk-bottom-${place}`}
						/>
					</View>
				</GestureDetector>
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
			<View
				ref={columnsRowRef}
				style={styles.columnsRow}
				onLayout={() => {
					columnsRowRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
						containerOffset.current = { x: pageX, y: pageY };
					});
				}}
			>
				{showOverflow && renderColumn("overflow")}
				{activePlaces.map((place) => renderColumn(place))}
			</View>

			<View style={styles.banner}>
				<Text
					style={[styles.bannerText, !solved && styles.bannerHidden]}
					// @ts-ignore — web-only
					data-testid="visual-correct-banner"
					testID="visual-correct-banner"
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
	overflowDisk: {
		width: 44,
		height: 44,
		alignItems: "center",
		justifyContent: "center",
	},
	overflowCircle: {
		width: 36,
		height: 36,
		borderRadius: 18,
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
	bannerHidden: {
		opacity: 0,
	},
});
