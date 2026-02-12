# Contributing to USDA Composer

## Commit Message Guidelines

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification. All commit messages **must** follow this format:

```
<type>(<scope>): <subject>
```

### Format Requirements

- **type**: Required - Must be one of the allowed types below
- **scope**: Optional but recommended - The area of the codebase affected
- **subject**: Required - Brief description (1-100 characters)

### Allowed Types

| Type       | Description              | Example                                       |
| ---------- | ------------------------ | --------------------------------------------- |
| `feat`     | New feature              | `feat(viewer): add zoom controls`             |
| `fix`      | Bug fix                  | `fix(parser): handle malformed USDA files`    |
| `docs`     | Documentation only       | `docs: update README with setup instructions` |
| `style`    | Code style/formatting    | `style(core): fix indentation`                |
| `refactor` | Code refactoring         | `refactor(state): simplify reducer logic`     |
| `test`     | Adding/updating tests    | `test(parser): add edge case tests`           |
| `chore`    | Maintenance tasks        | `chore: update dependencies`                  |
| `perf`     | Performance improvements | `perf(viewer): optimize render loop`          |
| `ci`       | CI/CD changes            | `ci: add GitHub Actions workflow`             |
| `build`    | Build system changes     | `build: configure Vite for production`        |
| `revert`   | Revert previous commit   | `revert: revert "feat(viewer): add zoom"`     |

### Commit Methods

#### Method 1: Using Git Commit Template (Recommended)

The repository is configured with a commit message template. When you run:

```bash
git commit
```

Your editor will open with a template showing the required format and examples.

#### Method 2: Using Helper Scripts

For quick commits, use the provided helper scripts:

**Windows:**

```cmd
commit.bat feat viewer "add zoom controls"
```

**Linux/Mac:**

```bash
chmod +x commit.sh
./commit.sh feat viewer "add zoom controls"
```

#### Method 3: Direct Git Commit

```bash
git commit -m "feat(viewer): add zoom controls"
```

### Common Scopes

- `viewer` - 3D viewport and rendering
- `parser` - USDA file parsing
- `editor` - Code editor functionality
- `core` - Core application logic
- `state` - State management
- `ui` - User interface components
- `utils` - Utility functions

### Examples

```bash
# Adding a new feature
git commit -m "feat(viewer): add zoom controls"

# Fixing a bug
git commit -m "fix(parser): handle empty USDA files"

# Updating documentation
git commit -m "docs: add API documentation"

# Refactoring code
git commit -m "refactor(core): simplify state initialization"

# Adding tests
git commit -m "test(utils): add validation tests"
```

### Pre-commit Hooks

This project uses Husky and lint-staged to:

1. Run ESLint and Prettier on staged files
2. Run related tests automatically
3. Validate commit message format

If your commit is rejected, ensure:

- Your commit message follows the format above
- All linting passes
- All tests pass

### Troubleshooting

**Error: "Invalid commit message format"**

- Check that your message follows: `type(scope): subject`
- Ensure the type is one of the allowed types
- Subject must be between 1-100 characters

**Error: Tests or linting failed**

- Run `npm run lint:fix` to auto-fix linting issues
- Run `npm test` to check failing tests
- Fix issues before committing

## Development Workflow

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes
3. Stage your changes: `git add .`
4. Commit with proper format: Use any of the methods above
5. Push your branch: `git push origin feat/your-feature`
6. Create a pull request

## Questions?

If you have questions about contributing, please open an issue on GitHub.
