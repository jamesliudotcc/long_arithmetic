import { PLACES, type Place } from "@domain/addition";
import { canCarry as domainCanCarry } from "@domain/visual-addition";
import type { VisualZone } from "@domain/visual-addition";
import { PlaceDiscs } from "@react/PlaceDiscs";
import { useAdditionStore } from "@react/store";
import { colors, radius, spacing, typography } from "@react/theme";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

// Mirror PlaceDiscs constants to size the overflow box to match column height
const DISC_SIZE = 36;
const DISC_GAP = spacing.sm;
const MAX_BORDER = 2;
const ZONE_HEIGHT = 2 * DISC_SIZE + DISC_GAP + 2 * DISC_GAP + 2 * MAX_BORDER; // 100
const OVERFLOW_BOX_SIZE = ZONE_HEIGHT;

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

	useEffect(() => {
		if (!draggingFrom || typeof document === "undefined") return;
		const nextPlaceKey: Place | "overflow" =
			PLACES[PLACES.indexOf(draggingFrom.place) + 1] ?? "overflow";
		const nextColor = PLACE_COLORS[nextPlaceKey];
		const nextDenom = PLACE_DENOMINATIONS[nextPlaceKey];

		const ghost = document.createElement("div");
		Object.assign(ghost.style, {
			position: "fixed",
			pointerEvents: "none",
			background: nextColor,
			color: "white",
			width: "36px",
			height: "36px",
			borderRadius: "50%",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			fontWeight: "bold",
			fontSize: "12px",
			zIndex: "9999",
			opacity: "0.9",
			boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
			left: "-200px",
		});
		ghost.textContent = nextDenom;
		document.body.appendChild(ghost);
		document.body.style.cursor = "grabbing";

		function handleMove(e: PointerEvent) {
			ghost.style.left = `${e.clientX + 14}px`;
			ghost.style.top = `${e.clientY + 14}px`;
		}
		window.addEventListener("pointermove", handleMove);

		return () => {
			document.body.removeChild(ghost);
			document.body.style.cursor = "";
			window.removeEventListener("pointermove", handleMove);
		};
	}, [draggingFrom]);

	// Active places most-significant first for display
	const activePlaces = PLACES.slice(0, numPlaces).reverse() as Place[];
	const showOverflow = true;

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

	function handleDropByClientCoords(clientX: number, clientY: number) {
		if (!draggingFrom || typeof document === "undefined") return;
		let el: Element | null = document.elementFromPoint(clientX, clientY);
		while (el) {
			const testId = el.getAttribute("data-testid");
			if (testId?.startsWith("visual-column-")) {
				const key = testId.replace("visual-column-", "") as Place | "overflow";
				handleDrop(key);
				return;
			}
			el = el.parentElement;
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
					style={styles.column}
					// @ts-ignore — web-only
					data-testid="visual-column-overflow"
					testID="visual-column-overflow"
				>
					<Text style={styles.columnLabel}>{label}</Text>
					<View
						style={[
							styles.overflowBox,
							dropTarget && styles.overflowBoxDropTarget,
						]}
					>
						{overflow > 0 && (
							<View style={[styles.overflowDisc, { backgroundColor: color }]}>
								<Text style={styles.overflowDiscLabel}>
									{PLACE_DENOMINATIONS.overflow}
								</Text>
							</View>
						)}
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
				style={[
					styles.column,
					isPending && styles.columnPending,
					dropTarget && styles.columnDropTarget,
				]}
				// @ts-ignore — web-only
				data-testid={`visual-column-${place}`}
				testID={`visual-column-${place}`}
			>
				<Text style={[styles.columnLabel, isDone && styles.labelDone]}>
					{label}
				</Text>
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
					onCarryDragStart={() => setDraggingFrom({ place, zone: "top" })}
					testID={`visual-zone-top-${place}`}
					diskTestIDPrefix={`visual-disk-top-${place}`}
				/>
				<View style={styles.zoneSep} />
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
					onDiskPointerDown={() => handleDiskPointerDown("bottom")}
					onCarryDragStart={() => setDraggingFrom({ place, zone: "bottom" })}
					testID={`visual-zone-bottom-${place}`}
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
			// @ts-ignore — web pointer event
			onPointerUp={(e: React.PointerEvent) =>
				handleDropByClientCoords(e.clientX, e.clientY)
			}
		>
			<View style={styles.columnsRow}>
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
		// @ts-ignore — web-only
		outline: "2px dashed #f39c12",
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
	overflowBox: {
		width: OVERFLOW_BOX_SIZE,
		height: OVERFLOW_BOX_SIZE,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.sm,
		alignItems: "center",
		justifyContent: "center",
	},
	overflowBoxDropTarget: {
		borderColor: PLACE_COLORS.overflow,
		borderWidth: 2,
	},
	overflowDisc: {
		width: DISC_SIZE,
		height: DISC_SIZE,
		borderRadius: DISC_SIZE / 2,
		alignItems: "center",
		justifyContent: "center",
	},
	overflowDiscLabel: {
		fontSize: 12,
		fontWeight: "700",
		color: "#fff",
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
