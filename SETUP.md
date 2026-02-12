# Setup Guide

This guide will help you set up the USDA Composer development environment.

## 📋 Prerequisites

### Required Software

- **Node.js** 20.x or higher
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify: `node --version`

- **npm** 9.x or higher
  - Comes with Node.js
  - Verify: `npm --version`

- **Git** 2.x or higher
  - Download from [git-scm.com](https://git-scm.com/)
  - Verify: `git --version`

### Recommended Tools

- **VS Code** - Recommended IDE
  - Extensions:
    - ESLint
    - Prettier
    - Vitest
    - Error Lens
    - GitLens

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/USDA-Composer.git
cd USDA-Composer
```

### 2. Install Dependencies

```bash
npm install
```

This will install all dependencies and automatically run `npm run prepare` to set up git hooks.

### 3. Verify Installation

Run the test suite to ensure everything is working:

```bash
npm test
```

### 4. Start Development Server

```bash
npm run dev
```

The application should open in your browser at `http://localhost:3000`

## 🔧 Configuration

### TypeScript

TypeScript is configured for incremental adoption:

- `tsconfig.json` - TypeScript configuration
- `jsconfig.json` - JavaScript IDE support

Currently in **lenient mode** - will be tightened gradually.

### ESLint

Configuration: `eslint.config.js`

Run manually:

```bash
npm run lint        # Check for issues
npm run lint:fix    # Fix auto-fixable issues
```

### Prettier

Configuration: `.prettierrc`

Run manually:

```bash
npm run format      # Format all files
```

### Git Hooks

Configured via Husky in `.husky/`:

- **pre-commit**: Runs lint-staged (lint + format changed files)
- **pre-push**: Runs type-check + tests
- **commit-msg**: Validates commit message format

## 📝 Environment Variables

Currently, the application doesn't require environment variables. If needed in the future, create a `.env` file:

```bash
# .env
# Add your environment variables here
```

## 🧪 Running Tests

### Unit Tests

```bash
# Watch mode (recommended during development)
npm test

# Run once
npm test -- --run

# With coverage
npm run test:coverage

# With UI
npm run test:ui
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive)
npx playwright test --ui

# Run specific test
npx playwright test tests/example.spec.js
```

### Type Checking

```bash
npm run type-check
```

### Full Validation

Run everything (type-check + lint + test):

```bash
npm run validate
```

## 🏗️ Building

### Development Build

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

Output: `dist/` directory

### Preview Production Build

```bash
npm run preview
```

## 🐛 Troubleshooting

### Issue: `npm install` fails

**Solution 1**: Clear cache and retry

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Solution 2**: Check Node.js version

```bash
node --version  # Should be 20.x or higher
```

### Issue: Tests fail on fresh install

**Cause**: Playwright browsers not installed

**Solution**:

```bash
npx playwright install chromium
```

### Issue: Git hooks not working

**Cause**: Hooks not executable or not installed

**Solution**:

```bash
npm run prepare
chmod +x .husky/*  # On macOS/Linux
```

### Issue: TypeScript errors in IDE

**Cause**: IDE using wrong TypeScript version

**Solution** (VS Code):

1. Open command palette (Ctrl+Shift+P)
2. Type "TypeScript: Select TypeScript Version"
3. Choose "Use Workspace Version"

### Issue: Port 3000 already in use

**Solution 1**: Use different port

```bash
PORT=3001 npm run dev
```

**Solution 2**: Kill process on port 3000

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

## 🎯 Development Workflow

1. **Create a branch**

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes**
   - Write code
   - Add tests
   - Update documentation

3. **Run validation**

   ```bash
   npm run validate
   ```

4. **Commit changes**

   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

   Commit message will be validated by git hook.

5. **Push and create PR**
   ```bash
   git push origin feature/my-feature
   ```

## 📚 Additional Resources

- [Contributing Guide](./CONTRIBUTING.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [Main README](./README.md)

## 💡 Tips

### Fast Test Feedback

Use watch mode during development:

```bash
npm test
```

Tests related to changed files will re-run automatically.

### Debugging Tests

Use VS Code debugger:

1. Add breakpoint in test
2. Click "Debug" in test file
3. Or use `debugger` statement

### Debugging Build Issues

Enable verbose output:

```bash
npm run build -- --debug
```

### Performance Profiling

Use Chrome DevTools:

1. Open app in Chrome
2. F12 → Performance tab
3. Record and analyze

## 🔐 Security

### Dependencies

We use Dependabot to keep dependencies updated. Review and merge PRs regularly.

### Reporting Security Issues

Email: security@example.com (TODO: Add actual email)

## ❓ Getting Help

- **Documentation**: Check docs in `/docs` folder
- **Issues**: Search existing issues on GitHub
- **Discussions**: Use GitHub Discussions
- **Contributors**: Tag maintainers in issues/PRs

---

Happy coding! 🎉
