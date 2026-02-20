import "@picocss/pico/css/pico.min.css";
import { LocalStorageAdapter } from "@infrastructure/local-storage-adapter";
import { initializeStorage } from "@react/store";
import { registerRootComponent } from "expo";
import App from "./App";

initializeStorage(new LocalStorageAdapter());
registerRootComponent(App);
