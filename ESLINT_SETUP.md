# ESLint Setup for Backend

The backend now has ESLint configured for code quality and consistency.

## Installation

ESLint dependencies need to be installed. Run:

```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

Or with bun:

```bash
bun add --dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

## Usage

### Check for linting errors

```bash
npm run lint
```

### Auto-fix linting errors

```bash
npm run lint:fix
```

### Type checking

```bash
npm run type-check
```

## Configuration

ESLint configuration is in [`.eslintrc.json`](./.eslintrc.json).

### Current Rules

**TypeScript Rules:**
- `@typescript-eslint/no-explicit-any`: **warn** - Discourages use of `any` type
- `@typescript-eslint/no-unused-vars`: **warn** - Catches unused variables
- `@typescript-eslint/no-non-null-assertion`: **warn** - Warns on unsafe `!` assertions

**Code Quality:**
- `no-console`: **warn** (allows `console.warn`, `console.error`, `console.info`)
- `no-var`: **error** - Must use `const` or `let`
- `prefer-const`: **warn** - Prefer `const` for non-reassigned variables

**Best Practices:**
- `eqeqeq`: **error** - Must use `===` instead of `==`
- `curly`: **error** - Requires curly braces for all control statements
- `no-eval`: **error** - Prevents use of `eval()`

## Expected Warnings

With the current codebase, you'll see warnings for:

1. **~20 `any` type usages** - Should be replaced with proper types
2. **~46 console.log statements** - Should use proper logging
3. **~15 unused variables** - Should be removed or prefixed with `_`
4. **~10 non-null assertions** - Should be replaced with null checks

These are documented in [TYPESCRIPT_STRICT_MODE_MIGRATION.md](./TYPESCRIPT_STRICT_MODE_MIGRATION.md).

## IDE Integration

### VS Code

Install the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) for real-time linting in your editor.

Add to `.vscode/settings.json`:
```json
{
  "eslint.validate": ["typescript"],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### WebStorm/IntelliJ

ESLint is automatically detected. Enable auto-fix on save in:
**Settings > Languages & Frameworks > JavaScript > Code Quality Tools > ESLint**

## Ignoring Files

Files and directories ignored by ESLint (configured in `.eslintrc.json`):
- `dist/**` - Build output
- `node_modules/**` - Dependencies
- `*.js` - JavaScript files (we only lint TypeScript)

## CI/CD Integration

Add to your CI pipeline:

```bash
npm run lint
npm run type-check
npm run build
```

## Gradual Adoption

Since this is the first time ESLint is being added, you can:

1. **Start with warnings only** (current setup)
2. **Fix errors incrementally** over time
3. **Gradually increase strictness** as code improves

## Resources

- [ESLint Documentation](https://eslint.org/docs/latest/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [ESLint Rules Reference](https://eslint.org/docs/latest/rules/)
