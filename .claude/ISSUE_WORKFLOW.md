# GitHub Issue Workflow Guide

This document defines the workflow for starting, updating, and continuing work on GitHub issues using the `/issue` command.

## Quick Start

```
/issue 67
```

Replace `67` with the issue number you want to work on.

---

## What This Workflow Does

### 1. Fetch Issue Details
- Gets the issue title, body, labels, and current state
- Reviews all comments to understand project history
- Identifies what work has already been done

### 2. Assess Current Status
- Check if there's an active branch for this issue (e.g., `feature/gh67-...`)
- Determine which phase or feature is being worked on
- Identify any blockers or incomplete work

### 3. Review Handoff Documentation
- Look for agent handoff comments in the issue
- Check for planning documents in `/docs/`
- Understand the next steps and prerequisites

### 4. Plan Next Actions
- Determine if continuing previous work or starting fresh
- Create/update a TODO list for the session
- Identify any git branches to checkout or create

### 5. Execute Work
- Make code changes following the CODE_QUALITY_STANDARDS
- Run tests and build to verify
- Create commits with proper messages

### 6. Document for Handoff
- Update the GitHub issue with progress
- Create comprehensive handoff comments
- Push branch to origin for next agent

---

## Issue States

### Starting Fresh
1. Read issue body completely
2. Check `/docs/` for existing plans
3. Create feature branch: `feature/gh{ISSUE}-description`
4. Begin implementation following CODE_QUALITY_STANDARDS

### Continuing Work
1. Identify active branch (usually most recent)
2. Check for handoff comments with status
3. Read TODO list and next steps
4. Switch to branch and continue from where it left off
5. Update issue with new progress

### Finishing Phase/Feature
1. Verify all acceptance criteria met
2. Run full test suite
3. Create build verification
4. Write comprehensive handoff comment
5. Push branch to origin
6. Mark ready for merge or next phase

---

## Handoff Comment Template

When finishing a session, include this in an issue comment:

```markdown
## 🔄 Agent Handoff - [Phase/Feature Name] (YYYY-MM-DD)

### Session Summary
- **Agent:** [Claude Model]
- **Branch:** feature/gh{ISSUE}-...
- **Status:** [Complete/In Progress/Blocked]

### What Was Done
- [Implementation detail 1]
- [Implementation detail 2]

### Verification
| Check | Status |
|-------|--------|
| Build | ✅/❌ |
| Tests | ✅/❌ |
| Code Quality | ✅/❌ |

### Next Steps
1. [Action 1]
2. [Action 2]

### Key Files
- file1.ts
- file2.ts

### Prerequisites for Production
- [Prereq 1]
- [Prereq 2]

*Handoff complete. Ready for [Phase X / merge / testing].*
```

---

## Code Quality Standards Checklist

Before committing, verify:

- [ ] All tests pass (`npm run test:run`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console.log statements
- [ ] TypeScript strict mode passes
- [ ] Component <400 LOC
- [ ] DRY principle followed (no duplication)
- [ ] Error handling implemented
- [ ] Accessibility verified (mobile 390px tested)
- [ ] Git account correct (check `git config user.email`)
- [ ] Commit message follows conventional commits

---

## Git Branch Naming Convention

```
feature/gh{ISSUE}-{description}
fix/gh{ISSUE}-{description}
docs/gh{ISSUE}-{description}
```

Example: `feature/gh67-phase5-presence`

---

## Helpful Commands

```bash
# Fetch issue details
gh issue view {ISSUE_NUMBER}

# Get issue comments
gh issue view {ISSUE_NUMBER} --json comments

# Create issue comment (programmatically)
gh issue comment {ISSUE_NUMBER} --body "message"

# List issue labels
gh issue view {ISSUE_NUMBER} --json labels

# Get current branch
git branch --show-current

# Check recent commits
git log --oneline -10

# Verify tests
npm run test:run

# Verify build
npm run build

# Verify lint
npm run lint
```

---

## Issue Workflow Decision Tree

```
START: /issue {NUMBER}
  ↓
FETCH issue details
  ↓
  Is there an active branch?
  ├─ YES: Checkout branch, read handoff, continue
  └─ NO: Create new branch, read body, plan work
  ↓
CREATE todo list for session
  ↓
VERIFY prerequisites (tests pass, branch correct, etc.)
  ↓
EXECUTE work following standards
  ↓
  Is work complete?
  ├─ YES: Write handoff, push branch
  └─ NO: Write progress, push branch, note blockers
  ↓
END: Ready for next agent
```

---

## Example Usage

### Starting Phase 5 Presence Work
```
/issue 67
```

Claude will:
1. Fetch issue #67 (Social Features)
2. See Phase 5 is the next phase
3. Create `feature/gh67-phase5-presence` branch
4. Read planning docs
5. Create TODO list
6. Begin implementation

### Continuing Interrupted Work
```
/issue 67
```

Claude will:
1. Fetch issue #67
2. See `feature/gh67-phase5-presence` branch exists
3. Checkout that branch
4. Read the most recent handoff comment
5. Continue from where the last agent left off
6. Update progress in new comment

---

## Related Documentation

- **Code Quality Standards:** `.claude/CLAUDE.md` (Code Quality Standards section)
- **UI/UX Guide:** `.claude/rules/STYLE_GUIDE.md`
- **Testing Requirements:** `.claude/CLAUDE.md` (Testing Requirements section)
- **Issue Plans:** `docs/` directory

---

*Last updated: 2026-01-17*
*For questions or improvements, update this file.*
