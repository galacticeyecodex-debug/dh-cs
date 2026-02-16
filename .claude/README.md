# Claude Code Assistant Instructions

This `.claude/` directory contains configuration and instructions for Claude Code (the CLI tool) when working on this project.

## Files in This Directory

| File | Purpose |
|------|---------|
| `CLAUDE.md` | **Main instructions** - Code style, conventions, testing requirements, quality standards |
| `rules/STYLE_GUIDE.md` | UI/UX design standards and component conventions |
| `rules/UI_CARD_REFERENCE.md` | ASCII diagrams of critical UI components |
| `GITHUB_ISSUE_COMMAND.md` | Documentation for the `/issue` command workflow |
| `ISSUE_WORKFLOW.md` | Detailed guide for starting, updating, continuing GitHub issue work |
| `settings.local.json` | Local permissions for git, gh, npm commands |

## Quick Start: Working on Issues

To start, update, or continue work on any GitHub issue, use:

```
/issue {ISSUE_NUMBER}
```

Example: `/issue 67`

This automatically:
1. Fetches the issue and reads all comments
2. Checks for existing feature branches
3. Creates or switches to the appropriate branch
4. Reads previous handoff documentation
5. Plans the work for the current session
6. Begins implementation or continues from where it left off

**See:** `GITHUB_ISSUE_COMMAND.md` and `ISSUE_WORKFLOW.md` for full details.

---

## Key Principles

### Code Quality
All commits must meet the standards in `CLAUDE.md`:
- ✅ Tests pass (`npm run test:run`)
- ✅ Build succeeds (`npm run build`)
- ✅ No console.log in production
- ✅ TypeScript strict mode
- ✅ Components <400 LOC
- ✅ DRY principle
- ✅ Mobile accessibility

### Git Commits
- **Email**: Use configured git email only (no Claude author tags)
- **Format**: Conventional commits (`feat:`, `fix:`, `test:`, etc.)
- **Message**: 1-2 sentences describing the "why"
- **Reference**: Include issue number (`Ref #67`)

### Testing
- Game logic: 100% test coverage
- UI Components: Test interactions
- Store actions: Test mutations
- Run: `npm run test:run` (2,197+ tests total)

### Handoff Documentation
Every session ends with a comment on the GitHub issue:
```markdown
## 🔄 Agent Handoff - [Feature Name] (Date)

### Session Summary
- Agent: Claude Model
- Branch: feature/gh{ISSUE}-...
- Status: [Complete/In Progress]

### What Was Done
- Implementation detail 1
- Implementation detail 2

### Verification
| Check | Status |
|-------|--------|
| Build | ✅ |
| Tests | ✅ (2,197 passing) |

### Next Steps
1. Action 1
2. Action 2

Ready for [Phase X / merge].
```

---

## Project Structure

```
dh-cs/
├── .claude/
│   ├── CLAUDE.md (← Main instructions, read first)
│   ├── rules/
│   │   ├── STYLE_GUIDE.md
│   │   └── UI_CARD_REFERENCE.md
│   ├── GITHUB_ISSUE_COMMAND.md
│   ├── ISSUE_WORKFLOW.md
│   ├── settings.local.json
│   └── README.md (← You are here)
├── app/
│   └── (Next.js app router pages)
├── components/
│   └── (React components)
├── store/
│   └── (Zustand state management)
├── lib/
│   └── (Utilities and helpers)
├── types/
│   └── (TypeScript type definitions)
├── __tests__/
│   └── (Test files)
├── docs/
│   └── (Analysis, plans, documentation - gitignored)
└── srd/
    └── (Daggerheart System Reference Document)
```

---

## Important Notes

### Dual-Codebase Architecture
- **`dh-cs`**: Online version (Supabase backend)
- **`dh-cs-native`**: Offline version (SQLite backend)
- Shared code in `dh-cs` syncs to `dh-cs-native` via `sync-native.js`
- Shared UI components **never import from `@/lib/supabase/*`**

### Naming Conventions
- **TypeScript**: camelCase (`isLoading`, `updateCharacter`)
- **Database**: snake_case (`user_id`, `character_name`)

### Testing
- Always write tests BEFORE implementing features (TDD)
- Test file locations mirror source (e.g., `lib/foo.ts` → `__tests__/lib/foo.test.ts`)
- Run tests frequently during development

### Build & Deploy
- Build must succeed: `npm run build`
- Lint must be clean: `npm run lint`
- No console.log in production code
- TypeScript strict mode enforced

---

## GitHub Issue Workflow

### Starting Fresh (`/issue 67`)
1. Creates new branch: `feature/gh67-description`
2. Reads issue body and documentation
3. Plans implementation
4. Creates TODO list
5. Begins work

### Continuing Work (`/issue 67`)
1. Finds existing branch
2. Checks out branch
3. Reads latest handoff comment
4. Resumes from previous point
5. Updates progress

### Finishing Work (`/issue 67`)
1. Verifies all acceptance criteria
2. Runs full test suite (all passing)
3. Verifies build succeeds
4. Writes comprehensive handoff comment
5. Pushes to origin

---

## Useful Commands

```bash
# View issue
gh issue view 67
gh issue view 67 --json comments

# Comment on issue
gh issue comment 67 --body "Status update"

# Check git config
git config user.email
git log --oneline -5

# Run tests
npm run test:run

# Build verification
npm run build

# Push branch
git push origin feature/gh67-phase5-presence

# Check current branch
git branch --show-current
```

---

## For New Agents

1. **Read `CLAUDE.md`** first - Contains all code quality standards
2. **Understand the project** - Read README in root, check `.claude/rules/`
3. **Use `/issue {NUMBER}`** to start work
4. **Follow the workflow** - Fetch → Plan → Execute → Handoff
5. **Test frequently** - Run `npm run test:run` and `npm run build`
6. **Document handoffs** - Write comprehensive comments for next agent

---

## Quick Reference: Phase Status

| Phase | Status | Branch |
|-------|--------|--------|
| Phase 1: Campaign Foundation | ✅ Complete | merged |
| Phase 2: GM Screen MVP | ✅ Complete | merged |
| Phase 3: Activity Feed | ✅ Complete | merged |
| Phase 4: Real-Time Subscriptions | ✅ Complete | merged |
| Phase 5: Presence System | ✅ Complete | `feature/gh67-phase5-presence` |
| Phase 6: Homebrew Sharing | ⏳ Not started | - |
| Phase 7: Friendships | ⏳ Not started | - |

**Next:** Phase 6 (Homebrew Sharing) or merge Phase 5

---

## Support

- **Code Quality Questions**: See `CLAUDE.md` (Code Quality Standards section)
- **UI/UX Standards**: See `rules/STYLE_GUIDE.md`
- **Testing Questions**: See `CLAUDE.md` (Testing Requirements section)
- **Issue Workflow**: See `GITHUB_ISSUE_COMMAND.md` and `ISSUE_WORKFLOW.md`
- **Phase Plans**: Check `/docs/` directory for detailed phase documentation

---

**Last Updated:** 2026-01-17
**For:** Claude Code users working on Daggerheart Character Sheet
**Maintainer:** Alex (galactic.eye.codex@gmail.com)
