---
trigger: always_on
glob: "**/*"
description: Rules for creating high-quality git commits for the Daggerheart project.
---

# Git Commit Rules

All git commits must follow the **Conventional Commits** specification, pass all pre-commit checks, and use the correct contributor information.

## Contributor Information

Every commit MUST be authored by:
`Alex <alex.plocik.home@gmail.com>`

Use `Co-Authored-By: Claude <noreply@anthropic.com>` in commit messages when AI assisted.

## Commit Workflow

### Step 1: Gather Context (Run in Parallel)

Run these commands simultaneously to understand the current state:

```bash
git status
git diff --staged && git diff
git log --oneline -5
```

### Step 2: Pre-Commit Quality Gate

All checks must pass before committing. Run sequentially:

```bash
npm run lint
npm run build
npm run test:run
```

> [!IMPORTANT]
> A commit is only allowed if all three checks (lint, build, test) exit with success code.

### Step 3: Stage and Commit

Stage specific files (prefer explicit files over `git add -A`):

```bash
git add path/to/file1 path/to/file2
```

Create the commit using HEREDOC for proper multi-line formatting:

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <description>

<optional body explaining what and why>

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Step 4: Verify Success

```bash
git status
```

## Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Allowed Types

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Formatting, whitespace, missing semi-colons (no code change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `build` | Build system or external dependency changes |
| `ci` | CI configuration changes |
| `chore` | Other changes that don't modify src or test files |

### Allowed Scopes

| Scope | Description |
|-------|-------------|
| `app` | Global application logic/routing |
| `ui` | Shared UI components/styles |
| `dice` | Dice roller components |
| `srd` | System Reference Document content or parser |
| `lib` | Shared library utilities |
| `hook` | Custom React hooks |
| `db` | Database/Supabase migrations and schema |
| `types` | TypeScript definition changes |
| `scripts` | Maintenance or utility scripts |
| `combat` | Combat view and related components |
| `inventory` | Inventory view and related components |
| `playmat` | Playmat view and related components |
| `character` | Character view and related components |
| `downtime` | Downtime view and related components |
| `vault` | Vault/Loadout related components |
| `vitals` | Vital track components (HP, Stress, Hope, etc.) |
| `conductor` | Conductor methodology (plans, specs, etc.) |

## Best Practices

- **Imperative Mood**: Use present tense ("change" not "changed" nor "changes")
- **Atomic Commits**: Each commit should represent a single, logical change
- **Short Summary**: Keep the first line under 72 characters
- **Detailed Body**: Use the body to explain the *what* and *why* if the change is complex
- **Explicit Staging**: Stage specific files by name rather than using `git add -A` to avoid accidental commits
- **Reference Issues**: Include `Ref #123` or `Resolves #123` in body when applicable

## Git Safety Rules

- **NEVER** use `--force`, `--hard`, or destructive commands without explicit user request
- **NEVER** skip hooks (`--no-verify`) unless explicitly requested
- **NEVER** amend commits after a hook failure - create a NEW commit instead
- **NEVER** commit sensitive files (`.env`, credentials, secrets)
- **NEVER** push to main/master without explicit approval
