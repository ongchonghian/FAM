## Coding Guardrails (Project)

### Safety
- Do not commit secrets (API keys, tokens, service account JSON, private keys, .env files).
- Do not log or print secrets in code or terminal output.
- Prefer least-privilege access patterns; avoid hardcoding credentials.

### Git Hygiene
- Confirm the repository root before running git commands.
- Avoid committing large generated artifacts unless explicitly intended.
- Never commit dependency directories (e.g., node_modules) or editor/system artifacts (e.g., .DS_Store).
- Use clear commit messages that describe the change.

### Quality
- Follow existing code patterns and naming conventions.
- Add validation and error handling where changes introduce new failure modes.
- Run relevant tests/build before pushing when feasible.

### Documentation
- Keep README/setup steps accurate when behavior or prerequisites change.
