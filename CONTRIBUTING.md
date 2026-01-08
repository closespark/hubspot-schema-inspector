# Contributing to HubSpot Schema Inspector

Thank you for your interest in contributing to HubSpot Schema Inspector! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/hubspot-schema-inspector.git
   cd hubspot-schema-inspector
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the project:
   ```bash
   npm run build
   ```

## Development Workflow

### Making Changes

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes in the `src/` directory

3. Build and test your changes:
   ```bash
   npm run build
   export HUBSPOT_ACCESS_TOKEN=your_test_token
   npm run dev schemas
   ```

4. Test different commands:
   ```bash
   npm run dev schemas
   npm run dev object contacts
   npm run dev associations contacts companies
   npm run dev custom
   npm run dev errors
   ```

### Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and single-purpose

### Project Structure

```
src/
├── cli.ts              # CLI entry point with command definitions
├── commands.ts         # Command implementations
├── hubspot-client.ts   # HubSpot API client
├── types.ts            # TypeScript type definitions
├── utils.ts            # Utility functions and formatters
└── index.ts            # Main export file
```

## Submitting Changes

1. Commit your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "Add feature: description of what you added"
   ```

2. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

3. Open a Pull Request from your fork to the main repository

### Pull Request Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Ensure your code builds without errors
- Test your changes with a real HubSpot account if possible
- Update documentation if you're adding new features

## Reporting Issues

When reporting issues, please include:

- A clear description of the problem
- Steps to reproduce the issue
- Expected vs actual behavior
- Your environment (Node.js version, OS, etc.)
- Any error messages or logs

## Feature Requests

We welcome feature requests! Please:

- Check if the feature has already been requested
- Clearly describe the feature and its use case
- Explain how it would benefit users of the tool

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Maintain a positive and collaborative environment

## Questions?

If you have questions about contributing, feel free to:
- Open an issue with the "question" label
- Reach out to the maintainers

Thank you for contributing to HubSpot Schema Inspector!
