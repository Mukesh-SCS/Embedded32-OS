# Contributing to Embedded32

Thank you for your interest in contributing to Embedded32!

## Ways to Contribute

- **Report Bugs** - Submit detailed bug reports
- **Suggest Features** - Propose new features or improvements
- **Write Documentation** - Improve docs, add tutorials
- **Submit Code** - Fix bugs or implement features
- **Create Examples** - Share working example projects

## Getting Started

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

### 4. Build and Test

```bash
npm run build
npm run test
```

## Development Guidelines

### Code Style

- Use TypeScript for all code
- Follow existing code formatting
- Add comments for complex logic
- Write self-documenting code

### Commit Messages

Follow conventional commits:

```
type(scope): brief description

Fixes #123
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

**Examples:**
```
feat(j1939): add DM2 diagnostic support
fix(can): resolve SocketCAN buffer overflow
docs(readme): update installation instructions
```

### Testing

```bash
npm run test
```

- Write tests for new features
- Ensure all tests pass before submitting

## Project Structure

```
embedded32/
├── embedded32-core/      # OS runtime
├── embedded32-can/       # CAN layer
├── embedded32-j1939/     # J1939 stack
├── embedded32-ethernet/  # Ethernet/MQTT
├── embedded32-bridge/    # Protocol bridging
├── embedded32-sim/       # Vehicle simulator
├── embedded32-tools/     # CLI tools
├── embedded32-dashboard/ # Web UI
├── embedded32-sdk-*/     # SDKs (JS, Python, C)
├── examples/             # Example projects
└── docs/                 # Documentation
```

## Bug Reports

Please include:

1. **Description** - Clear description of the bug
2. **Steps to Reproduce** - Detailed steps
3. **Expected vs Actual** - What should happen vs what happens
4. **Environment** - OS, Node version, hardware
5. **Logs** - Relevant error messages

## Feature Requests

Please include:

1. **Use Case** - Why is this needed?
2. **Proposed Solution** - How should it work?
3. **Alternatives** - Other approaches considered

## Pull Request Process

1. Update documentation for any changes
2. Add tests for new features
3. Update CHANGELOG.md
4. Ensure all CI checks pass
5. Request review from maintainers

### PR Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Code follows style guidelines

## Questions?

- Open a [GitHub Discussion](https://github.com/Mukesh-SCS/Embedded32/discussions)
- Review existing [Issues](https://github.com/Mukesh-SCS/Embedded32/issues)

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Embedded32!** 🎉
