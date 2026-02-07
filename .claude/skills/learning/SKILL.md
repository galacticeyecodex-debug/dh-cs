# /learning - Extract Session Insight

Capture a single sentence of hard-won advice from the current session and add it to `.claude/rules/learnings.md`.

## When to Use

Use `/learning` after completing a task where:
- You ran around in circles before finding the right approach
- You were corrected after going down the wrong path
- You discovered something non-obvious about the codebase
- A pattern or anti-pattern became clear only in hindsight

Either the user OR Claude can initiate this command.

## Instructions

1. **Reflect on the session**: What would have saved time if you knew it before starting?

2. **Distill to ONE sentence**: The learning must be:
   - Actionable (tells future-you what to DO or CHECK)
   - Specific (references actual code patterns, files, or concepts)
   - Contextual (briefly notes what task revealed this insight)

3. **Categorize the learning** under the appropriate section in `.claude/rules/learnings.md`:
   - Data & Type Semantics
   - UI & Component Patterns
   - Parser & Enhancement System
   - Testing & Debugging
   - Git & Workflow
   - (Create new sections if needed)

4. **Format**: Add as a bullet point with the insight in bold, followed by explanation and issue/context reference:
   ```markdown
   - **The insight in bold** - additional context explaining why this matters. *(Issue #XX: brief description of what revealed this)*
   ```

5. **Read the existing file first** to avoid duplicates and maintain consistent style.

6. **Append the new learning** to the appropriate section using the Edit tool.

7. **Confirm** what was added by showing the user the new entry.

## Example Output

After a session fixing a bug where modifiers weren't displaying correctly:

> Added to `.claude/rules/learnings.md` under "UI & Component Patterns":
>
> - **Always check if a component uses raw `modifier.value` vs calculated values from formulas** - static values in JSON (like `value: 0`) may be placeholders for dynamic formulas that need `calculateDynamicValue()`. *(Issue #95: Rage Up showed +0 instead of calculated 2×Strength)*
