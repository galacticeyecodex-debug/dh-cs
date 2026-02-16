---
argument-hint: ISSUE_NUMBER [model]
description: Start, update, or continue work on a GitHub issue with automatic workflow
model: claude-opus-4-5-20251101
---

# GitHub Issue Workflow Command

This command automates the workflow for starting, updating, and continuing work on GitHub issues.

## Usage

```
/issue 67                           # Uses default Opus model
/issue 67 haiku                     # Uses Haiku for quick tasks
/issue 67 sonnet                    # Uses Sonnet for balanced tasks
/issue 67 opus                      # Uses Opus (default) for complex tasks
```

Replace `67` with the GitHub issue number you want to work on.

**Model Selection:**
- **haiku** - Fast, lightweight tasks (research, simple fixes)
- **sonnet** - Balanced tasks (most feature work, refactoring)
- **opus** (default) - Complex tasks (architecture, multi-phase features)

If no model is specified, defaults to Opus for comprehensive issue handling.

## What This Does

### 1. Fetch Issue Details
- Gets the issue title, body, labels, and state
- Reads all comments to understand project history
- Identifies what work has already been done

### 2. Assess Current Status
- Checks if there's an active branch for this issue
- Determines which phase or feature is being worked on
- Identifies any blockers or incomplete work

### 3. Smart Branch Handling
- **If branch exists**: Checks it out and resumes work
- **If branch doesn't exist**: Creates new branch with proper naming

### 4. Review Handoff Documentation
- Reads the most recent handoff comment in the issue
- Checks for planning documents in `.claude/` and `docs/`
- Understands the next steps and prerequisites

### 5. Plan Session Work
- Creates a TODO list for the current session
- Identifies blockers or incomplete work
- Sets up git branch correctly
- Verifies prerequisites (tests pass, build working, etc.)

### 6. Execute Work
- Follows CODE_QUALITY_STANDARDS for all changes
- Commits with proper conventional commit messages
- Updates issue with progress

### 7. Document Handoff
- Writes comprehensive handoff comment
- Pushes branch to origin
- Marks work ready for next phase or merge

## Workflow Decision Tree

```
START: /issue 67
  ↓
FETCH issue details via gh
  ↓
Is there an active branch for this issue?
├─ YES: Checkout branch
│   ├─ Read most recent handoff comment
│   └─ Continue from previous point
│
└─ NO: Create new branch (feature/gh67-...)
    ├─ Read issue body
    └─ Plan implementation from docs/
  ↓
VERIFY prerequisites
├─ Tests passing?
├─ Build working?
└─ Git configured correctly?
  ↓
EXECUTE work following CODE_QUALITY_STANDARDS
  ↓
Is work complete for this session?
├─ YES: Write handoff comment, push branch
└─ NO: Write progress comment, push branch
  ↓
END: Ready for next agent
```

## Example: Starting Phase 5 (Issue #67)

```
/issue 67
```

Claude will:
1. Fetch issue #67 (Social Features: Campaigns, Real-Time Play & Sharing)
2. See that Phase 5 (Presence System) is the next phase
3. Create or checkout `feature/gh67-phase5-presence` branch
4. Read any existing handoff comments
5. Create a TODO list for Phase 5 work
6. Begin implementation following the standards

## Example: Continuing Work

When you use `/issue 67` again:

1. Fetch issue #67
2. Find `feature/gh67-phase5-presence` branch exists
3. Checkout that branch
4. Read the most recent handoff comment with status
5. Continue from where the previous agent left off
6. Update the issue with progress

## Handoff Comment Format

Every session should end with a comment like:

```markdown
## 🔄 Agent Handoff - [Phase/Feature Name] (YYYY-MM-DD)

### Session Summary
- **Agent:** Claude Model Name
- **Branch:** feature/gh{ISSUE}-...
- **Status:** [Complete/In Progress/Blocked]

### What Was Done
- [Implementation detail 1]
- [Implementation detail 2]

### Verification
| Check | Status |
|-------|--------|
| Build | ✅/❌ |
| Tests | ✅/❌ ({N} passing) |
| Lint  | ✅/❌ |

### Files Changed
- file1.ts - Description
- file2.tsx - Description

### Next Steps
1. [Action 1]
2. [Action 2]

### Prerequisites for Production
- [Prereq 1]
- [Prereq 2]

*Ready for [Phase X / merge / testing].*
```

## Code Quality Standards (Must Pass)

Before every commit, verify:

- [ ] Tests pass: `npm run test:run`
- [ ] Build succeeds: `npm run build`
- [ ] No console.log statements
- [ ] TypeScript strict mode passes
- [ ] Components <400 LOC
- [ ] DRY principle followed (no duplication)
- [ ] Error handling implemented
- [ ] Mobile accessibility (tested at 390px)
- [ ] Git email correct: `git config user.email`
- [ ] Commit message follows conventional commits

## Related Documentation

- **Code Quality Standards**: `.claude/CLAUDE.md`
- **UI/UX Guide**: `.claude/rules/STYLE_GUIDE.md`
- **Workflow Details**: `.claude/ISSUE_WORKFLOW.md`
- **Command Docs**: `.claude/GITHUB_ISSUE_COMMAND.md`

## Key Commands

```bash
# View issue and comments
gh issue view 67
gh issue view 67 --json comments

# Comment on issue
gh issue comment 67 --body "Status update"

# Check git branch
git branch --show-current
git log --oneline -5

# Run tests
npm run test:run

# Build
npm run build

# Push branch
git push origin feature/gh67-...
```

## Git Workflow

```bash
# Switch to or create feature branch
git checkout -b feature/gh67-description

# Make changes, test, commit
npm run test:run
npm run build
git add .
git commit -m "feat(gh67): description of feature"

# Push to origin
git push origin feature/gh67-description

# Comment on issue with progress
gh issue comment 67 --body "## Update: ..."
```

## Tips for Success

### When Starting Fresh
1. Read the issue body completely
2. Check `/docs/` for existing phase plans
3. Review code quality standards in `.claude/CLAUDE.md`
4. Create detailed TODO list
5. Run full test suite before starting

### When Continuing
1. Find and checkout the right branch
2. Read the most recent handoff comment
3. Verify branch is up-to-date
4. Create TODO list from handoff notes
5. Verify tests/build before resuming

### When Finishing
1. Review acceptance criteria from issue
2. Run full test suite (all passing)
3. Verify build succeeds
4. Write detailed handoff comment
5. Push to origin
6. Note blockers or next steps

---

**For full workflow details, see:**
- `.claude/ISSUE_WORKFLOW.md` - Complete workflow guide
- `.claude/GITHUB_ISSUE_COMMAND.md` - Command implementation details
- `.claude/README.md` - Overview of Claude instructions
