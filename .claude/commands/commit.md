---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(gh:*), Bash(git diff:*), Read, Glob, Grep
argument-hint: [optional message]
description: Create a git commit
model: claude-3-5-haiku-20241022
---

Review the staged changes and create an appropriate git commit message.

If $ARGUMENTS is provided, use it as the commit message. Otherwise:
1. Run `git status` to see all untracked files
2. Run `git diff` to see staged and unstaged changes
3. Run `git log` to understand recent commit message style
4. Analyze the changes and craft a meaningful, conventional commit message
5. Create the commit with author: Alex <galactic.eye.codex@gmail.com>

Never use alternate emails, Claude as author, or Co-Authored-By tags. Follow conventional commits format (feat:, fix:, test:, etc.).
If changes reference a GitHub issue, include it in the commit body as "Ref #123" or "Fixes #123".
