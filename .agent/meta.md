# Antigravity Agent Meta-Guide (Rules, Workflows, and Memories)

This document serves as the primary reference for the Antigravity Agent to manage its own behavior through rules, workflows, and memories.

## 🛠️ Rules (`.agent/rules/*.md`)

Rules are permanent behavioral constraints. They are applied based on the frontmatter configuration.

- **Trigger**: `always_on` (runs on every step) or `user_invoked`.
- **Glob**: Restricts rules to specific files (e.g., `**/*.ts`).
- **Description**: Explains the rule's purpose to the model.

### Active Custom Rules
- **WSL Interop (`wsl-interop.md`)**: Always use `wsl -d Ubuntu` for git and gh CLI.
- **Git Commit (`git-commit.md`)**: Strict adherence to conventional commits and authorship.

## 🌊 Workflows (`.agent/workflows/*.md`)

Workflows are multi-step automation scripts.

- **Directives**: 
  - `// turbo`: Auto-run the *next* command step.
  - `// turbo-all`: Auto-run *all* command steps in the workflow.
- **Execution**: Triggered via slash commands or when the user references them.

### Active Custom Workflows
- **GH Issue via WSL (`wsl-gh-issue.md`)**: Automation for issue tracking.
- **Git Commit (`git-commit.md`)**: The full quality gate and commit process.

## 🧠 Memories (`.agent/memories.md`)

Memories are persistent context blocks that store user preferences, project-specific knowledge, and recurring patterns.

### Core User Preferences
- **WSL Preference**: The user prefers all terminal-based development tools (Git, GH CLI, NPM) to run inside the Ubuntu WSL distribution.
- **No More Coding**: The current task is focused on infrastructure, rules, and documentation rather than feature development.
- **Explicit WSL Distribution**: Use `-d Ubuntu` explicitly in WSL commands.

### Interaction Patterns
- **GitHub CLI**: Preferred over manual web UI actions for issue management.
- **Atomic Workflows**: Small, modular workflows for specific tasks (like creating an issue).

## 🚀 How to Self-Update
1.  **Observe failures**: If a command fails due to environment mismatch, update the corresponding Rule.
2.  **Capture patterns**: If a task is repeated 3+ times, create a Workflow.
3.  **Learn preferences**: When the user provides explicit feedback on style or tool choice, document it in `memories.md`.
