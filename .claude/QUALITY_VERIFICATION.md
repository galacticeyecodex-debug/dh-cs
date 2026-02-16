# Quality Verification Process

This document describes the actual quality verification process for the Daggerheart Character Sheet project, as implemented in the codebase.

## Mandatory Quality Checks (Before Commit)

The project uses individual quality commands rather than a combined `test:quality` script:

```bash
# 1. Code quality (ESLint)
npm run lint

# 2. Build verification
npm run build

# 3. Unit tests
npm run test:run
```

**All three must pass before committing.**

### What Each Command Does

| Command | Purpose | Status |
|---------|---------|--------|
| `npm run lint` | ESLint code quality check | ✅ Fast (~5s) |
| `npm run build` | Next.js build compilation | ✅ Fast (~30s) |
| `npm run test:run` | Vitest unit test suite (2564 tests) | ✅ Fast (~4s) |

### Combined Command

You can run all three in sequence:

```bash
npm run lint && npm run build && npm run test:run
```

Or with output logging:

```bash
npm run lint > lint.log 2>&1 && \
npm run build > build.log 2>&1 && \
npm run test:run > tests.log 2>&1 && \
echo "✅ All quality checks passed"
```

## Expected Results

**Passing Quality Gate:**
- ✅ ESLint: 0 warnings, 0 errors
- ✅ Build: Successful compilation
- ✅ Tests: All 2564 tests pass across 80 test files

**Example Test Output:**
```
Test Files  80 passed (80)
Tests       2564 passed | 3 skipped (2567)
Duration    ~4-5 seconds
```

## Optional Visual Verification

For UI component changes, also run:

```bash
npm run e2e:screenshot    # Capture visual snapshots
npm run e2e:headed        # Run E2E tests with visible browser
```

## Common Issues

### Build Fails
- Check for TypeScript errors
- Verify all imports resolve
- Check ESLint errors haven't been addressed

### Tests Fail
- Review test output for specific failures
- Check if code change requires test updates
- Verify no regressions in related modules

### Lint Warnings
- ESLint warnings must be fixed before commit
- Use `npm run lint` to see all warnings
- Fix unused imports, variables, etc.

## Git Commit Process

After quality verification passes:

```bash
git add <files>
git commit -m "type(scope): description

- Change 1
- Change 2

Quality verification:
✅ npm run lint passed
✅ npm run build successful
✅ npm run test:run passed (2564 tests)

Ref #ISSUE_NUMBER"
```

## Note on `/commit` Skill

The Claude Code `/commit` skill references a `npm run test:quality` script that doesn't exist in this project. When using `/commit`, interpret the quality gate requirements as:

- `npm run test:quality` → Run `npm run lint && npm run build && npm run test:run`
- All three checks must pass independently

This discrepancy is due to the skill being a generic Claude Code feature, while this project has specific npm scripts defined in `package.json`.
