# Architecture: Long Arithmetic Engine

This document describes the architecture of the Long Arithmetic engine — a Hexagonal, State-Machine driven approach that treats math problems as a series of auditable transactions rather than simple calculations.

## 1. Design Philosophy

- **Hexagonal Isolation**: The core math logic (the Domain) is decoupled from the UI (Expo/React Native) and state management (Zustand).
- **State Machine Transitions**: Every user interaction is an "Intent" that triggers a state transition, governed by strict pedagogical rules.
- **No premature abstraction**: There are four operations (addition, subtraction, multiplication, division) — keep their logic in distinct silos.

## 2. The Domain Layer

The Domain contains the pure math rules. It has no knowledge of the web, CSS, or storage.

### Data Entities

- **Tableau**: A rigid, place-value based structure (e.g., `ones_pl`, `tens_pl`) rather than coordinate arrays.
- **Digit**: An object containing `baseValue`, `scratchpad_1`, `scratchpad_2`, and `isSlashed`.
- **StepResult**: A result object returned by the Referee (e.g., `{ status: 'SUCCESS', nextRequiredAction: 'CARRY' }`).

### Domain Services

- **Referee Service**: Validates whether an input is mathematically sound given the current state.
- **Problem Generator**: Procedural generation of problems based on difficulty profiles (e.g., "Borrow Across Zero").

## 3. The State Machine (Zustand + Immer)

State is managed as a centralized, immutable tree. Immer is used to perform mutative logic that produces clean, serializable snapshots.

### Stores

- **`useProblemStore`**: Manages the current active problem, carry tiers, and placeholder logic.
- **`useHistoryStore`**: An event-log of every Intent and Snapshot for forensic replay.
- **`useSettingsStore`**: Global configuration (UI preferences, difficulty).

## 4. Ports and Adapters

| Port | Direction | Description |
|------|-----------|-------------|
| UI Intent | Driving | The UI sends intents like `INPUT_DIGIT` or `SLASH_COLUMN`; the Domain validates before state updates. |
| Persistence | Driven | Automatically saves the state tree to local storage. |
| Interaction Log | Driven | Captures Domain Events (e.g., `CarryTriggered`) for the history log. |

## 5. Operation-Specific Logic

While the architecture is shared, each operation's logic remains in a distinct silo to avoid premature abstraction.

| Operation | Logic Pattern | Carry/Scratchpad Behavior |
|-----------|---------------|--------------------------|
| Addition | Vertical Stack | Single-tier carry row (`tier_0`) |
| Subtraction | Destructive | Multi-tier scratchpads with `isSlashed` state |
| Multiplication | The Skyscraper | Max 3 tiers of carries; horizontal partial products |
| Division | The Waterfall | Descending subtraction blocks; "Bring Down" logic |

## 6. The Forensic Replay System

To support auditing a student's work, the system implements lightweight event sourcing:

1. Store the `InitialSeed` (to recreate the problem).
2. Store a list of `Intents` (user actions).
3. **Replay**: Feed the Intents back into the InitialSeed to recreate the student's exact thought process, including mistakes and corrections.
