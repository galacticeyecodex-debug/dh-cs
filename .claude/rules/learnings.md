# Session Learnings

Accumulated insights from past coding sessions. Each learning is a hard-won piece of advice that would have saved time if known beforehand.

---

## Data & Type Semantics

- **When a field has conditional semantics (like `target_reaction: true`), always trace how that condition affects every consumer of that data** - the presence of data and its meaning for the user are often different things. *(Issue #95: Onslaught showed a roll button because code checked if `roll` existed, not who makes the roll)*

---

## UI & Component Patterns

- **When displaying formula-based values in UI components, always check whether the formula needs base stats or modified stats** - `calculateDynamicValue()` uses raw `character.stats`, but UI displays often need the total after modifiers. Use `getStatModifiers()` to get the full modified value before applying formula multipliers. *(Issue #95: Rage Up showed -2 Damage using base Strength -1, but should show +8 using modified Strength +4)*

---

## Parser & Enhancement System

- **Always use `enhancement_override` for manual JSON edits - the `enhancement` block will be overwritten by the parser** - Running `npm run enhance-json` or similar parser commands regenerates the `enhancement` block from card text. Manual customizations (gains, modifiers, condition overrides) MUST go in `enhancement_override` to persist. The UI uses `getEnhancement()` which prefers `enhancement_override` when present. *(Issue #95: Multiple card edits were initially placed in `enhancement` and would have been lost)*

---

## Testing & Debugging

*(Learnings about test patterns, debugging strategies, and common pitfalls will go here)*

---

## Git & Workflow

*(Learnings about commit patterns, branch management, and CI/CD will go here)*
