import { PLACES, type Place } from "@domain/addition";
import { canBorrowFrom as domainCanBorrowFrom } from "@domain/visual-subtraction";
import { PlaceDiscs } from "@react/PlaceDiscs";
import { useAdditionStore } from "@react/store";
import { colors, radius, spacing, typography } from "@react/theme";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

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

	// draggingFrom: the place we're dragging from (the "lender" column)
	const [draggingFrom, setDraggingFrom] = useState<Place | null>(null);

	useEffect(() => {
		if (!draggingFrom || typeof document === "undefined") return;
		const color = PLACE_COLORS[draggingFrom];
		const denom = PLACE_DENOMINATIONS[draggingFrom];

		const ghost = document.createElement("div");
		Object.assign(ghost.style, {
			position: "fixed",
			pointerEvents: "none",
			background: color,
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
		ghost.textContent = denom;
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

	// Most-significant first for display
	const activePlaces = PLACES.slice(0, numPlaces).reverse() as Place[];

	function handleDrop(targetBorrowPlace: Place) {
		if (!draggingFrom) return;
		const sourceIdx = PLACES.indexOf(draggingFrom);
		const targetIdx = PLACES.indexOf(targetBorrowPlace);
		// Valid drop: target is exactly one place below source (borrow flows down)
		if (targetIdx === sourceIdx - 1) {
			borrowVisualSub(draggingFrom);
		}
		setDraggingFrom(null);
	}

	function handleDropByClientCoords(clientX: number, clientY: number) {
		if (!draggingFrom || typeof document === "undefined") return;
		let el: Element | null = document.elementFromPoint(clientX, clientY);
		while (el) {
			const testId = el.getAttribute("data-testid");
			if (testId?.startsWith("visual-sub-borrow-")) {
				const key = testId.replace("visual-sub-borrow-", "") as Place;
				handleDrop(key);
				return;
			}
			// An empty minuend zone is also a valid drop target (borrow + auto-drain
			// will fill it immediately)
			if (testId?.startsWith("visual-sub-minuend-")) {
				const key = testId.replace("visual-sub-minuend-", "") as Place;
				if (visualSubWork.columns[key].minuend === 0) {
					handleDrop(key);
					return;
				}
			}
			el = el.parentElement;
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
		const isBorrowTarget =
			isActive && draggingFrom === PLACES[activeColumn + 1];

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
				<PlaceDiscs
					count={col.minuend}
					denomination={PLACE_DENOMINATIONS[place]}
					color={color}
					solved={colSolved}
					locked={!isActive && !isNextColumn}
					canCarry={canLend}
					isDragSource={draggingFrom === place}
					onDiskPointerDown={
						isActive ? () => cancelVisualSub(place) : undefined
					}
					onCarryDragStart={
						isNextColumn ? () => setDraggingFrom(place) : undefined
					}
					testID={`visual-sub-minuend-${place}`}
					diskTestIDPrefix={`visual-sub-minuend-disk-${place}`}
				/>

				<View style={styles.zoneSep} />

				{/* Subtrahend zone — display only, locked */}
				<PlaceDiscs
					count={col.subtrahend}
					denomination={PLACE_DENOMINATIONS[place]}
					color={color}
					solved={colSolved}
					locked={true}
					canCarry={false}
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
			// @ts-ignore — web pointer event
			onPointerUp={(e: React.PointerEvent) =>
				handleDropByClientCoords(e.clientX, e.clientY)
			}
		>
			<View style={styles.columnsRow}>
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
