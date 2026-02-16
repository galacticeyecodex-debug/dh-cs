---
trigger: always_on
glob: "**/*"
description: Rules for using WSL to interact with git and gh cli.
---

# WSL Interop Rules

When performing git operations or using the GitHub CLI (`gh`), ALWAYS execute them within the Ubuntu WSL environment to ensure consistency with the project's development environment and configuration.

## Environment Shell Commands

All commands for `git` or `gh` MUST be prefixed with the WSL execution command:

```bash
wsl -d Ubuntu -e bash -c "cd /home/alexplocik/Github/Daggerheart/dh-cs && <command>"
```

### Git Operations

Use WSL for all git commands:
- `wsl -d Ubuntu -e bash -c "cd ... && git status"`
- `wsl -d Ubuntu -e bash -c "cd ... && git add <files>"`
- `wsl -d Ubuntu -e bash -c "cd ... && git commit -m '... '"`

### GitHub CLI (gh)

Use WSL for all GitHub CLI commands:
- `wsl -d Ubuntu -e bash -c "cd ... && gh issue create ..."`
- `wsl -d Ubuntu -e bash -c "cd ... && gh pr create ..."`
- `wsl -d Ubuntu -e bash -c "cd ... && gh issue list"`

## Path Mapping

Ensure that paths provided to commands are absolute paths relative to the WSL filesystem (`/home/alexplocik/...`) or use relative paths after the `cd` command.

## Rationale

- **Credentials**: Git and GH credentials are configured within the Ubuntu environment.
- **Hooks**: Git hooks (linting, tests) are designed to run in the Ubuntu/Linux environment.
- **Performance**: Executing commands directly in the native environment of the codebase avoids filesystem translation overhead and potential permissions issues.
