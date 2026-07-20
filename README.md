# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## PHI/secrets scan setup (one-time, per clone)

This repo blocks commits containing PHI or secrets via `.gitleaks.toml` + `.pre-commit-config.yaml`. `pre-commit` does not install the `gitleaks` binary for you, so each clone needs it on PATH once:

```
winget install Gitleaks.Gitleaks   # Windows
brew install gitleaks              # macOS
scoop install gitleaks             # Windows (alternative)
```

Then, from the repo root:

```
pip install pre-commit
pre-commit install
```

After that, `git commit` runs the scan automatically. Skipping this setup does not mean commits go through unscanned: pre-commit fails closed, blocking every commit with `Executable 'gitleaks' not found` until the binary is installed.
