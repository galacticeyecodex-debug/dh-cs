# Product Guidelines

## Documentation Standards
- **Standardized File Headers:** Every new or refactored file MUST include a top-level comment block specifying the file name, purpose, and key responsibilities.
- **TSDoc/JSDoc:** Use TSDoc for all public functions, classes, and exported interfaces to ensure clear developer tooling and IDE support.

## UI/UX Standards
- **Style Guide Adherence:** All UI development must strictly follow the specifications in `.gemini/rules/style-guide.md` regarding the color system, typography, and component patterns.
- **Mobile-First Development:** Layouts are optimized for a portrait mobile experience (390x844 viewport). Any responsive adaptations for larger screens must not compromise the mobile utility.

## Game Logic & Rule Implementation
- **SRD-First Research:** Before implementing or modifying mechanics, consult the relevant `srd/markdown/contents/` file to ensure alignment with official Daggerheart rules.
- **NLU Test-Driven Development (TDD):** Implement interactive features by first writing tests derived from human interpretation of SRD text, ensuring the parser logic is validated against intended behavior.
- **Official Terminology:** Use official Daggerheart terminology in `snake_case` for all data models, database columns, and logic variables (e.g., `armor_slots`, `stress_current`).

## State & Data Persistence
- **Optimistic Updates with Rollback:** Use the `withOptimisticUpdate` pattern for all Zustand store actions that perform database writes. This ensures a responsive UI while handling network failures gracefully via automatic state rollback.
- **Centralized Schema:** Maintain `supabase/schema.sql` as the single source of truth for the database structure. Service abstractions should be maintained to keep the logic decoupled from specific persistence layers.

## Testing & Quality Assurance
- **Comprehensive Unit Testing:** All pure functions and state management actions must be covered by Vitest suites.
- **Red-Green-Refactor:** Follow a strict TDD workflow for new feature implementation.
- **Pre-Commit Verification:** A successful project build (`npm run build`) and lint check are required before any commit to ensure system integrity.
