# Math Facts Quiz

A spaced repetition app for practicing long addition, long subtraction, long multiplication, long division.

## How It Works

For long addition and subtraction, everything with up to 4 digits is in scope. For multiplication, 4 for the multiplicand and 3 for the multiplier. For division, only 1 digit for the divisor.

The app uses the **SM-2 spaced repetition algorithm** to schedule reviews, prioritizing overdue items and introducing a configurable number of new items per session.

There is an admin panel that allows picking what type of problem and the degree of difficulty, and which also shows the stats, all time and the last day.

## Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- [GNU Make](https://www.gnu.org/software/make/)

## Setup

```sh
make install
```

## Make Targets

| Target | Description |
|--------|-------------|
| `make install` | Install dependencies |
| `make lint` | Lint and format check (Biome) |
| `make format` | Auto-fix lint and format issues |
| `make typecheck` | Type-check with TypeScript Go |
| `make test` | Run all tests (unit + e2e) |
| `make chingon` | Format, lint, typecheck, and test — todo bien |
| `make test.unit` | Run unit tests only |
| `make test.e2e` | Run Playwright e2e tests only |
| `make test.e2e.ui` | Run Playwright tests with interactive UI |

> The underlying `bun run` scripts in `package.json` still work (e.g. `bun test`, `bun run lint`).


## Architecture

- There are four total operations, so do not abstract the operations into "arithmetic".
- Always use descriptive object key/value pairs instead of arrays. It is much better to have { ones_pl: 3, tens_pl: 2, hundreds_pl: 1, ... } than [1, 2, 3] for debugging.
- Hexagonal / ports & adapters:

```
src/
  domain/           # Pure logic, no dependencies on UI or storage
    user-config.ts        # User preferences
    sm2.ts                # Pure SM-2 algorithm
    ports.ts              # StoragePort interface
  infrastructure/   # Concrete storage implementations
    in-memory-storage.ts      # Map-based (used by tests)
    local-storage-adapter.ts  # localStorage (used by web app)
```

- Use Zustand
- Use Immer

## Testing

All domain and infrastructure logic is tested with Bun's test runner. End-to-end browser tests use Playwright.

```sh
make test
```
