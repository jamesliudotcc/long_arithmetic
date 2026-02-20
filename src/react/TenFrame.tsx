import { colors, radius, spacing } from "@react/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

const DISK_SIZE = 22;
const DISK_GAP = 3;
const COLS = 5;
const ROWS = 2;

type TenFrameProps = {
	count: number;
	color: string;
	solved: boolean;
	locked: boolean;
	canCarry: boolean;
	onDiskPointerDown?: (e: React.PointerEvent, diskIndex: number) => void;
	onCarry: () => void;
	testID?: string;
	carryBtnTestID?: string;
	diskTestIDPrefix?: string;
};

export function TenFrame({
	count,
	color,
	solved,
	locked,
	canCarry,
	onDiskPointerDown,
	onCarry,
	testID,
	carryBtnTestID,
	diskTestIDPrefix,
}: TenFrameProps) {
	const displayCount = Math.min(count, COLS * ROWS);
	const diskColor = solved ? colors.success : color;

	return (
		<View style={styles.wrapper}>
			<View
				style={[styles.frame, canCarry && styles.frameCarry]}
				// @ts-ignore — web-only data-testid
				data-testid={testID}
				testID={testID}
			>
				{Array.from({ length: ROWS }, (_, row) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: stable row index
					<View key={row} style={styles.gridRow}>
						{Array.from({ length: COLS }, (_, col) => {
							const slotIndex = row * COLS + col;
							const filled = slotIndex < displayCount;
							const diskTestID =
								diskTestIDPrefix && filled
									? `${diskTestIDPrefix}-${slotIndex}`
									: undefined;
							return (
								<View
									// biome-ignore lint/suspicious/noArrayIndexKey: stable slot index
									key={col}
									style={[
										styles.slot,
										filled && { backgroundColor: diskColor },
									]}
									// @ts-ignore — web-only
									data-testid={diskTestID}
									testID={diskTestID}
									// @ts-ignore — web pointer event
									onPointerDown={
										filled && !locked && onDiskPointerDown
											? (e: React.PointerEvent) =>
													onDiskPointerDown(e, slotIndex)
											: undefined
									}
								/>
							);
						})}
					</View>
				))}
			</View>
			{canCarry && !locked && (
				<Pressable
					style={styles.carryBtn}
					onPress={onCarry}
					// @ts-ignore — web-only
					data-testid={carryBtnTestID}
					testID={carryBtnTestID}
				>
					<Text style={styles.carryBtnText}>carry →</Text>
				</Pressable>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		alignItems: "center",
		gap: spacing.xs,
	},
	frame: {
		gap: DISK_GAP,
		padding: DISK_GAP,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.sm,
	},
	frameCarry: {
		borderColor: "#f39c12",
		borderWidth: 2,
	},
	gridRow: {
		flexDirection: "row",
		gap: DISK_GAP,
	},
	slot: {
		width: DISK_SIZE,
		height: DISK_SIZE,
		borderRadius: DISK_SIZE / 2,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: "transparent",
	},
	carryBtn: {
		paddingVertical: 2,
		paddingHorizontal: spacing.xs,
		borderRadius: radius.sm,
		backgroundColor: "#f39c12",
	},
	carryBtnText: {
		fontSize: 11,
		color: "#fff",
		fontWeight: "600",
	},
});
