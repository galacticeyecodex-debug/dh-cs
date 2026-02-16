# /issue Command - GitHub Issue Workflow

## Usage
```
/issue {ISSUE_NUMBER}
```

## Description
Automates the workflow for starting, updating, and continuing work on GitHub issues.

## Parameters
- `ISSUE_NUMBER` (required): The GitHub issue number (e.g., 67 for issue #67)

## Workflow

When you run `/issue 67`, Claude will:

### Phase 1: Fetch & Assess
1. Fetch the issue using `gh issue view 67 --json ...`
2. Read all comments to understand history
3. Determine current status (Not Started / In Progress / Complete)
4. Identify active branch if it exists

### Phase 2: Understand Context
5. Check if active branch exists: `git branch -a | grep gh67`
6. If branch exists: `git checkout` and read most recent handoff comment
7. If no branch: read issue body and `/docs/` planning documents
8. Review code quality standards and requirements

### Phase 3: Plan Work
9. Create TODO list for the session using TodoWrite
10. Identify next steps and blockers
11. Set up branch (create new or checkout existing)
12. Run verification: `npm run build` + `npm run test:run`

### Phase 4: Execute
13. Make code changes following standards
14. Commit frequently with proper messages
15. Push to origin regularly
16. Update issue progress with comments

### Phase 5: Handoff
17. Write comprehensive handoff comment
18. Verify build and tests one final time
19. Push all commits to origin
20. Mark ready for next agent or merge

## Implementation Details

### Required Tools
- `gh` (GitHub CLI) - for issue management
- `git` - for branch management
- `npm` - for build and test verification

### Expected Outcomes

#### If Starting Fresh
- New branch created: `feature/gh{ISSUE}-description`
- Issue read and understood
- Implementation plan created
- Work begins following CODE_QUALITY_STANDARDS

#### If Continuing
- Active branch checked out
- Handoff comment reviewed
- Work resumed from previous point
- Progress updated in issue

#### If Completing
- All acceptance criteria verified
- Tests passing (2,197+)
- Build successful
- Comprehensive handoff comment written
- Branch pushed and ready for merge

## Example: Starting Issue #67 Phase 5

```
/issue 67
```

Claude will:
1. `gh issue view 67 --json title,body,comments,labels`
2. See: "Social Features: Campaigns, Real-Time Play & Sharing"
3. See: Phase 5 (Presence System) is next
4. Check: `git branch -a | grep gh67`
5. Find: `feature/gh67-phase5-presence` exists
6. Checkout: `git checkout feature/gh67-phase5-presence`
7. Read: Most recent handoff comment
8. Create: TODO list from handoff
9. Continue: From where it left off
10. Update: Issue with new progress

## Best Practices

### When Starting
1. ✅ Read the issue body completely
2. ✅ Check `/docs/` for phase planning
3. ✅ Create feature branch with clear naming
4. ✅ Write TODO list immediately

### When Continuing
1. ✅ Identify the correct branch
2. ✅ Read the last handoff comment
3. ✅ Verify branch is up-to-date
4. ✅ Create new TODO list for session

### When Finishing
1. ✅ Verify all acceptance criteria
2. ✅ Run full test suite
3. ✅ Write detailed handoff comment
4. ✅ Push to origin
5. ✅ Note next steps for future agents

## Handoff Comment Format

Every session should end with a comment like:

```markdown
## 🔄 Agent Handoff - [Phase Name] (Date)

### Session Summary
- Agent: [Claude Model]
- Branch: feature/gh{ISSUE}-...
- Status: [Complete/In Progress]

### What Was Done
- [Accomplishment 1]
- [Accomplishment 2]

### Verification
| Check | Status |
|-------|--------|
| Build | ✅ |
| Tests | ✅ (2,197 passing) |

### Next Steps
1. [Action 1]
2. [Action 2]

*Ready for [Phase X / merge].*
```

## Related Documentation

- **Code Quality Standards**: `.claude/CLAUDE.md`
- **UI/UX Guide**: `.claude/rules/STYLE_GUIDE.md`
- **Workflow Details**: `.claude/ISSUE_WORKFLOW.md`
- **Phase Plans**: `docs/phase*.md`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Branch doesn't exist | Create new: `git checkout -b feature/gh{ISSUE}-...` |
| Handoff comment missing | Check issue comments or `/docs/` for context |
| Tests failing | Run `npm run test:run` to see failures, fix before commit |
| Build failing | Run `npm run build` to see errors, fix TypeScript/lint issues |
| Git config wrong | Run `git config user.email` and verify it's correct |

---

**Created:** 2026-01-17
**For Claude Code users:** Add this to your project for automated issue workflow
