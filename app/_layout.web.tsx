import "@picocss/pico/css/pico.min.css";
import "@react/overrides.css";
import { LocalStorageAdapter } from "@infrastructure/local-storage-adapter";
import { initializeStorage } from "@react/store";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	useEffect(() => {
		initializeStorage(new LocalStorageAdapter());
		SplashScreen.hideAsync();
	}, []);

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<Stack screenOptions={{ headerShown: false }} />
		</GestureHandlerRootView>
	);
}
