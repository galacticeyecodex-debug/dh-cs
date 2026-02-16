---
description: Start, update, or continue work on a GitHub issue with automatic workflow
---

// turbo-all

# GitHub Issue Workflow

This command automates the workflow for starting, updating, and continuing work on GitHub issues.

## Usage

```
/issue [ISSUE_NUMBER]
```

## What This Does

### 1. Fetch Issue Details
- Gets the issue title, body, labels, and state using `gh issue view [ISSUE_NUMBER]`.
- Reads all comments to understand project history: `gh issue view [ISSUE_NUMBER] --json comments`.
- Identifies what work has already been done.

### 2. Assess Current Status
- Checks if there's an active branch for this issue (e.g., `feature/gh[ISSUE_NUMBER]-...`).
- Determines which phase or feature is being worked on.
- Identifies any blockers or incomplete work from handoff comments.

### 3. Smart Branch Handling
- **If branch exists**: Checks it out and resumes work.
- **If branch doesn't exist**: Creates new branch with proper naming `feature/gh[ISSUE_NUMBER]-description`.

### 4. Review Handoff Documentation
- Reads the most recent handoff comment in the issue.
- Checks for planning documents in `.claude/` and `docs/`.
- Understands the next steps and prerequisites.

### 5. Plan Session Work
- Creates a TODO list for the current session.
- Identifies blockers or incomplete work.
- Verifies prerequisites (tests pass, build working, etc.).

### 6. Execute Work
- Follows **Code Quality Standards** for all changes.
- Commits with proper conventional commit messages.
- Updates issue with progress.

### 7. Document Handoff
- Writes comprehensive handoff comment.
- Pushes branch to origin.
- Marks work ready for next phase or merge.

## Workflow Decision Tree

```
START: /issue [NUMBER]
  ↓
FETCH issue details via gh
  ↓
Is there an active branch for this issue?
├─ YES: Checkout branch
│   ├─ Read most recent handoff comment
│   └─ Continue from previous point
│
└─ NO: Create new branch (feature/gh[NUMBER]-...)
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

## Handoff Comment Format

Every session should end with a comment like:

```markdown
## 🔄 Agent Handoff - [Phase/Feature Name] (YYYY-MM-DD)

### Session Summary
- **Agent:** [Agent Name]
- **Branch:** feature/gh[ISSUE]-...
- **Status:** [Complete/In Progress/Blocked]

### What Was Done
- [Implementation detail 1]
- [Implementation detail 2]

### Verification
| Check | Status |
|-------|--------|
| Build | ✅/❌ |
| Tests | ✅/❌ |
| Lint  | ✅/❌ |

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

## Key Commands (WSL)

All command-line interactions with GitHub and the repository should be performed via the WSL `Ubuntu` distribution to ensure proper configuration.

```bash
# 1. View issue details (CLEAN OUTPUT)
wsl -d Ubuntu -e bash -c "cd /home/alexplocik/Github/Daggerheart/dh-cs && gh issue view [ISSUE_NUMBER]"

# 2. Read all comments (most recent first)
wsl -d Ubuntu -e bash -c "cd /home/alexplocik/Github/Daggerheart/dh-cs && gh issue view [ISSUE_NUMBER] --json comments --jq '.comments | reverse | .[].body'"

# 3. Comment on issue (SIMPLE)
wsl -d Ubuntu -e bash -c "cd /home/alexplocik/Github/Daggerheart/dh-cs && gh issue comment [ISSUE_NUMBER] --body 'Progress update...'"

# 4. Comment on issue (MULTILINE/COMPLEX - Use this to avoid escaping hell)
# First, write your comment to a temp file in the workspace
# Then run:
wsl -d Ubuntu -e bash -c "cd /home/alexplocik/Github/Daggerheart/dh-cs && gh issue comment [ISSUE_NUMBER] --body-file [RELATIVE_PATH_TO_FILE]"

# 5. Close issue
wsl -d Ubuntu -e bash -c "cd /home/alexplocik/Github/Daggerheart/dh-cs && gh issue close [ISSUE_NUMBER]"

# 6. Branch management
wsl -d Ubuntu -e bash -c "cd /home/alexplocik/Github/Daggerheart/dh-cs && git checkout -b feature/gh[ISSUE_NUMBER]-description"
wsl -d Ubuntu -e bash -c "cd /home/alexplocik/Github/Daggerheart/dh-cs && git push origin feature/gh[ISSUE_NUMBER]-description"

# 7. Quality Checks (Run from workspace root)
npm run test:run
npm run build
npm run lint
```

## Tips for Success

### When Starting Fresh
1. Read the issue body completely.
2. Check `docs/` for existing phase plans.
3. Review code quality standards in `.claude/CLAUDE.md`.
4. Create a detailed TODO list.
5. Run the full test suite before starting.

### When Continuing
1. Find and checkout the right branch.
2. Read the most recent handoff comment.
3. Verify the branch is up-to-date.
4. Create a TODO list from handoff notes.
5. Verify tests/build before resuming.

### When Finishing
1. Review acceptance criteria from the issue.
2. Run the full test suite (all passing).
3. Verify the build succeeds.
4. Write a detailed handoff comment.
5. Push to origin.
6. Note blockers or next steps.

## Related Documentation

- **Code Quality Standards**: `.claude/CLAUDE.md`
- **UI/UX Guide**: `.claude/rules/STYLE_GUIDE.md`
- **Workflow Details**: `.claude/ISSUE_WORKFLOW.md`
- **Command Docs**: `.claude/GITHUB_ISSUE_COMMAND.md`