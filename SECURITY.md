# Security Policy

## Supported Versions

Only the latest `v1` release is supported with security fixes.

## Reporting a Vulnerability

Do not open public issues for security vulnerabilities.

Use GitHub private vulnerability reporting for this repository. If private vulnerability reporting is unavailable, contact the repository owner directly before sharing details publicly.

Include:

- A clear description of the issue
- Steps to reproduce
- Impacted version or commit
- Any relevant SARIF, workflow, or log excerpts with secrets removed

## Security Requirements

- Do not commit secrets, credentials, tokens, private keys, or customer data.
- Do not add network calls unless they are required for GitHub API functionality.
- Do not add shell execution paths for user-controlled input.
- Keep dependencies pinned to exact versions.
- Keep the bundled `dist/` output in sync with source changes.

## External Contributions

This repository is not accepting external code contributions.

Security reports are welcome through private vulnerability reporting. Unsolicited pull requests may be closed without review.
