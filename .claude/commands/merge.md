---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git merge:*), Bash(git checkout:*), Bash(git branch:*), Bash(git log:*), Bash(git push:*), Bash(npm:*), Bash(gh:*), Bash(git diff:*), Read, Glob, Grep
argument-hint: [optional message]
description: Squash, commit, and merge feature branch to main
model: claude-3-5-haiku-20241022
---

Commit all staged changes, verify quality gates, then squash-merge the feature branch to main with an auto-generated summary comment.

Workflow:
1. Run `git status` to verify current branch and check for uncommitted changes
2. Run `git diff` to see staged and unstaged changes
3. Run `git log` to understand recent commit message style
4. Commit all changes with appropriate conventional commit message (feat:, fix:, test:, chore:, etc.)
5. Run `npm run build` to verify the build succeeds (CRITICAL: per project standards)
6. Run `npm run test:run` to verify all tests pass
7. Run `npm run lint` to verify code quality
8. Attempt squash-merge to main with `git merge --squash origin/main`
9. **ALERT USER IF MERGE CONFLICTS DETECTED** - stop and ask user to resolve conflicts manually
10. If merge succeeds: Create merge commit with summary comment describing change type (fix/feature/chore/etc.)
11. Push merged main to remote with `git push origin main`

Critical checks:
- Verify current branch is NOT main (prevent accidental merges from main)
- Alert user immediately if uncommitted changes exist
- Alert user immediately if build fails (do not proceed to tests)
- Alert user immediately if tests fail (do not proceed to merge)
- Alert user immediately if lint fails (do not proceed to merge)
- Alert user immediately if merge conflicts are detected (user must resolve manually)

Never use alternate emails, Claude as author, or Co-Authored-By tags. Follow conventional commits format.
If changes reference a GitHub issue, include it in the commit/merge message as "Ref #123" or "Fixes #123".

The merge summary comment should briefly describe whether the changes are a fix, feature, chore, performance improvement, or other improvement type.
