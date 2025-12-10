# Contributing to Embedded32

Thank you for your interest in contributing to Embedded32! This document provides guidelines and instructions for contributing.

## 🌟 Ways to Contribute

- **Report Bugs** - Submit detailed bug reports
- **Suggest Features** - Propose new features or improvements
- **Write Documentation** - Improve docs, add tutorials
- **Submit Code** - Fix bugs or implement features
- **Create Examples** - Share working example projects
- **Answer Questions** - Help others in discussions

## 🚀 Getting Started

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/Embedded32.git
cd Embedded32
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a Branch

```bash
git checkout -b feature/my-new-feature
```

## 📝 Development Guidelines

### Code Style

- Use TypeScript for all JavaScript/Node.js code
- Follow existing code formatting
- Add comments for complex logic
- Write self-documenting code

### Commit Messages

Follow conventional commits format:

```
type(scope): brief description

Detailed description (optional)

Fixes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(j1939): add DM2 diagnostic support
fix(can): resolve SocketCAN buffer overflow
docs(readme): update installation instructions
```

### Testing

- Write tests for new features
- Ensure all tests pass before submitting
- Aim for good test coverage

```bash
npm run test:all
```

### Documentation

- Update README files when adding features
- Add JSDoc/TSDoc comments to functions
- Include examples in documentation

## 🔧 Project Structure

```
embedded32/
├── embedded32-core/          # OS runtime
├── embedded32-can/           # CAN layer
├── embedded32-j1939/         # J1939 stack
├── embedded32-ethernet/      # Ethernet/MQTT
├── embedded32-bridge/        # Protocol bridging
├── embedded32-tools/         # CLI tools
├── embedded32-dashboard/     # Web UI
├── embedded32-sdk-*/         # SDKs
├── examples/                 # Example projects
└── docs/                     # Documentation
```

## 🐛 Bug Reports

Please include:

1. **Description** - Clear description of the bug
2. **Steps to Reproduce** - Detailed steps
3. **Expected Behavior** - What should happen
4. **Actual Behavior** - What actually happens
5. **Environment** - OS, Node version, hardware
6. **Logs** - Relevant error messages or logs

## 💡 Feature Requests

Please include:

1. **Use Case** - Why is this needed?
2. **Proposed Solution** - How should it work?
3. **Alternatives** - Other approaches considered
4. **Additional Context** - Screenshots, mockups, etc.

## 🔀 Pull Request Process

1. **Update Documentation** - Document any changes
2. **Add Tests** - Include relevant tests
3. **Update CHANGELOG** - Add entry to CHANGELOG.md
4. **Pass CI Checks** - Ensure all checks pass
5. **Request Review** - Tag maintainers for review

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
Describe how you tested this

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Code follows style guidelines
```

## 🏗️ Module Development

### Creating a New Module

1. Create directory: `embedded32-mymodule/`
2. Add `package.json`
3. Add `README.md`
4. Create `src/`, `tests/`, `examples/`
5. Implement module interface
6. Write tests
7. Document API

### Module Interface

```typescript
export interface Module {
  name: string;
  version: string;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}
```

## 📚 Resources

- **Documentation:** [docs/](./docs/)
- **Examples:** [examples/](./examples/)
- **Roadmap:** [docs/roadmap.md](./docs/roadmap.md)
- **Architecture:** [docs/architecture.md](./docs/architecture.md)

## 🤔 Questions?

- Open a [GitHub Discussion](https://github.com/Mukesh-SCS/Embedded32/discussions)
- Check [FAQ](./docs/faq.md)
- Review existing [Issues](https://github.com/Mukesh-SCS/Embedded32/issues)

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Embedded32!** 🎉
