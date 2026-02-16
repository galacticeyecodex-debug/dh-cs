---
description: Run the full git commit process with quality checks. All commands auto-run without approval.
---

// turbo-all

# Git Commit Workflow

Automated git commit workflow with quality gate. Commands run without manual approval.

## Step 1: Gather Context

Check current state of the repository:

```bash
git status && git diff --stat
```

```bash
git log --oneline -3
```

## Step 2: Quality Gate (lint → build → test)

All checks must pass before committing:

```bash
npm run lint
```

```bash
npm run build 2>&1 | tail -20
```

```bash
npm run test:run 2>&1 | tail -20
```

## Step 3: Stage Changes

Stage the modified files (replace with actual file paths):

```bash
git add <files>
```

## Step 4: Create Commit

Create commit with conventional format:

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <description>

<body explaining the change>

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Step 5: Verify

Confirm the commit was successful:

```bash
git status && git log --oneline -1
```

---

## Commit Types

| Type | Use for |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring |
| `style` | Formatting only |
| `test` | Test changes |
| `docs` | Documentation |
| `chore` | Maintenance |

## Scopes

`app` `ui` `dice` `lib` `srd` `combat` `inventory` `playmat` `character` `downtime` `vitals` `vault` `db` `types`
