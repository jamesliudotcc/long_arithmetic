import { AsyncStorageAdapter } from "@infrastructure/async-storage-adapter";
import { initializeStorage } from "@react/store";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	useEffect(() => {
		AsyncStorageAdapter.create().then((storage) => {
			initializeStorage(storage);
			SplashScreen.hideAsync();
		});
	}, []);

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<Stack screenOptions={{ headerShown: false }} />
		</GestureHandlerRootView>
	);
}
