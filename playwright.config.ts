import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	timeout: 60_000,
	use: { baseURL: "http://localhost:8081" },
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: {
		command: "bunx expo start --web",
		url: "http://localhost:8081",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
