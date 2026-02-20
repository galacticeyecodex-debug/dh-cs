#!/bin/bash
#
# Install git hooks from scripts/hooks/ into .git/hooks/
# Run once after cloning: npm run hooks:install

set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_SRC="$REPO_ROOT/scripts/hooks"
HOOKS_DEST="$REPO_ROOT/.git/hooks"

for hook in "$HOOKS_SRC"/*; do
  name="$(basename "$hook")"
  dest="$HOOKS_DEST/$name"
  cp "$hook" "$dest"
  chmod +x "$dest"
  echo "✓ Installed .git/hooks/$name"
done

echo ""
echo "Git hooks installed successfully."
