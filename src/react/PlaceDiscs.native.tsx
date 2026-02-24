import { colors, radius, spacing } from "@react/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

const DISC_SIZE = 36;
const DISC_GAP = spacing.sm;
const DISCS_PER_ROW = 5;
const MAX_BORDER = 2;
const CONTAINER_WIDTH =
	DISCS_PER_ROW * DISC_SIZE +
	(DISCS_PER_ROW - 1) * DISC_GAP +
	2 * DISC_GAP +
	2 * MAX_BORDER;
const CONTAINER_HEIGHT =
	2 * DISC_SIZE + DISC_GAP + 2 * DISC_GAP + 2 * MAX_BORDER;

type PlaceDiscsProps = {
	count: number;
	denomination: string;
	color: string;
	solved: boolean;
	locked: boolean;
	canCarry: boolean;
	onDiskPointerDown?: () => void;
	isDragSource?: boolean;
	testID?: string;
	diskTestIDPrefix?: string;
};

export function PlaceDiscs({
	count,
	denomination,
	color,
	solved,
	locked,
	canCarry,
	isDragSource,
	onDiskPointerDown,
	testID,
	diskTestIDPrefix,
}: PlaceDiscsProps) {
	return (
		<View style={styles.wrapper}>
			<View
				style={[
					styles.discGrid,
					canCarry && styles.discGridCarry,
					isDragSource && styles.discGridDragSource,
				]}
				// @ts-ignore — web-only
				data-testid={testID}
				testID={testID}
			>
				{Array.from({ length: count }, (_, i) => {
					const diskTestID = diskTestIDPrefix
						? `${diskTestIDPrefix}-${i}`
						: undefined;
					return (
						<Pressable
							// biome-ignore lint/suspicious/noArrayIndexKey: stable disc index
							key={i}
							onPress={() => {
								if (!locked && !canCarry) {
									onDiskPointerDown?.();
								}
							}}
						>
							<View
								style={[styles.disc, { backgroundColor: color }]}
								// @ts-ignore — web-only
								data-testid={diskTestID}
								testID={diskTestID}
							>
								<Text style={styles.discLabel}>{denomination}</Text>
							</View>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		alignItems: "center",
		gap: spacing.xs,
	},
	discGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: DISC_GAP,
		width: CONTAINER_WIDTH,
		height: CONTAINER_HEIGHT,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.sm,
		padding: DISC_GAP,
	},
	discGridCarry: {
		borderColor: "#f39c12",
		borderWidth: 2,
	},
	discGridDragSource: {
		opacity: 0.4,
	},
	disc: {
		width: DISC_SIZE,
		height: DISC_SIZE,
		borderRadius: DISC_SIZE / 2,
		alignItems: "center",
		justifyContent: "center",
	},
	discLabel: {
		fontSize: 12,
		fontWeight: "700",
		color: "#fff",
	},
});
