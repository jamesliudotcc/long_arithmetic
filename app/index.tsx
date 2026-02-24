import { useAdditionStore } from "@react/store";
import { Redirect } from "expo-router";

export default function Index() {
	const difficulty = useAdditionStore((s) => s.difficulty);
	const mode = useAdditionStore((s) => s.mode);

	return (
		<Redirect
			href={{
				pathname: "/addition",
				params: {
					numDigits: String(difficulty.numPlaces),
					numCarries: String(difficulty.numCarries),
					mode,
				},
			}}
		/>
	);
}
