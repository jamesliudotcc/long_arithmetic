.PHONY: help install clean chingon lint format typecheck build.web build.web.dist serve.web run test.unit test.e2e test.e2e.ui test

help: ## Show this help
	@grep -hE '^[a-z0-9._]+:.*##' $(MAKEFILE_LIST) | awk -F ':.*## ' '{printf "  %-20s %s\n", $$1, $$2}'

# Install
install: ## Install dependencies
	bun install

clean: ## Remove node_modules, dist, and build artifacts
	rm -rf node_modules dist src/web/app.js src/web/sw.js

chingon: format lint typecheck test ## Format, lint, typecheck, and test — todo bien

# Quality
lint: ## Lint and format check (Biome)
	bunx biome check .

format: ## Auto-fix lint and format issues
	bunx biome check --write .

typecheck: ## Type-check with TypeScript Go
	bunx tsgo --noEmit

# Test
test.unit: ## Run unit tests only
	bun test .test.

test.e2e: ## Run Playwright e2e tests only
	bunx playwright test

test.e2e.ui: ## Run Playwright tests with interactive UI
	bunx playwright test --ui

test: test.unit test.e2e ## Run all tests (unit + e2e)

# Dev / Build
run: ## Start Expo dev server
	bunx expo start

serve.web: ## Start Expo web dev server
	bunx expo start --web

build.web: ## Export web build (outputs to dist/)
	bunx expo export --platform web

build.web.dist: ## Export web build explicitly to dist/
	bunx expo export --platform web --output-dir dist
