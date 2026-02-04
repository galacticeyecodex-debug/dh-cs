# Session Learnings

Accumulated insights from past coding sessions. Each learning is a hard-won piece of advice that would have saved time if known beforehand.

---

## Data & Type Semantics

- **When a field has conditional semantics (like `target_reaction: true`), always trace how that condition affects every consumer of that data** - the presence of data and its meaning for the user are often different things. *(Issue #95: Onslaught showed a roll button because code checked if `roll` existed, not who makes the roll)*

---

## UI & Component Patterns

*(Learnings about React components, state management, and UI logic will go here)*

---

## Parser & Enhancement System

*(Learnings about card-parser.ts, modifier-aggregator.ts, and the enhancement pipeline will go here)*

---

## Testing & Debugging

*(Learnings about test patterns, debugging strategies, and common pitfalls will go here)*

---

## Git & Workflow

*(Learnings about commit patterns, branch management, and CI/CD will go here)*
