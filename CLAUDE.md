# Agent Rules & Architecture

## Tech Stack
- **Runtime**: Bun
- **Framework**: Expo (Universal: Web + React Native)
- **Language**: TypeScript
- **Linter/Formatter**: Biome
- **Compiler**: Use Bun's native type stripping plus TypeScript Go
- **Test Runner**: Bun's native test runner (`bun test`) for unit & integration tests, Playwright for e2e browser tests

## Architecture: Hexagonal / Ports & Adapters
1. **Domain Layer (`/src/domain`)**: Pure logic, Math Fact entities, SR algorithms. No dependencies on UI or Storage.
2. **Infrastructure Layer (`/src/infrastructure`)**: Concrete implementations (Storage adapters, API clients).
3. **Presentation Layer (`/src/react`)**: Expo/React components for presentation.
4. **Dependency Injection**: The Presentation layer injects Infrastructure into Domain.

## Development Workflow (Strict TDD)
1. **Red**: Write a test in `foo.test.ts` next to the logic file.
2. **Green**: Write the minimal code to pass the test.
3. **Refactor**: Clean up the code while maintaining test pass.
4. **Persistence**: Use interfaces for storage to allow swapping `localStorage` (web) for `SQLite` (mobile).

## Key Make Targets

Use the Makefile for running things to avoid missing steps.

- `make test` — run all tests (unit + e2e)
- `make test.unit` — unit tests only
- `make test.e2e` — Playwright e2e tests only
- `make test.e2e.ui` — Playwright tests with interactive UI
- `make lint` — Biome lint/format check
- `make format` — auto-fix lint/format
- `make typecheck` — TypeScript Go type check

## Coding Standards
- No `div` or `span` in the React code. Use `View` and `Text` from `react-native`.
- Use Biome for formatting.
- LaTeX for complex math rendering only.
- For web, use semantic HTML and Pico CSS.
- Use `make format` after even small code changes.
- Use `make chingon` after big changes. If you are going to commit, the pre-commit checks always run `make chingon`
