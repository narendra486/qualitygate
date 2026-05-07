# QualityGate

[![CI](https://github.com/your-org/QualityGate/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/QualityGate/actions/workflows/ci.yml)
[![Release](https://github.com/your-org/QualityGate/actions/workflows/release.yml/badge.svg)](https://github.com/your-org/QualityGate/actions/workflows/release.yml)

A production-grade reusable GitHub Action that enforces security quality gates based on SARIF scan results from tools like CodeQL, Trivy, Snyk, Semgrep, and Checkov.

## Features

- ✅ **SARIF 2.1.0 Compatible** - Supports all major security scanners
- ✅ **Enterprise Ready** - Works with GitHub Enterprise and public GitHub
- ✅ **PR Integration** - Posts detailed comments and blocks merges
- ✅ **Step Summary** - Rich GitHub Actions summaries
- ✅ **Flexible Thresholds** - Configurable severity-based gating
- ✅ **Multi-file Support** - Process multiple SARIF files
- ✅ **Deduplication** - Remove duplicate findings
- ✅ **Filtering** - Ignore specific rules and paths
- ✅ **Annotations** - GitHub Checks API integration
- ✅ **Retry Logic** - Robust API error handling
- ✅ **TypeScript** - Strong typing and clean architecture

## Quick Start

```yaml
name: Security Quality Gate

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  pull-requests: write
  security-events: read

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run CodeQL
        uses: github/codeql-action/analyze@v3
        with:
          output: sarif-results

      - name: Quality Gate
        uses: your-org/QualityGate@v1
        with:
          sarif_file: sarif-results/javascript.sarif
          severity_threshold: high
          github_token: ${{ secrets.GITHUB_TOKEN }}
          pr_comment: true
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `sarif_file` | ✅ | - | SARIF file path(s) - single file or multiline list |
| `severity_threshold` | ✅ | - | Threshold: `low`, `medium`, `high`, `critical` |
| `github_token` | ✅ | - | GitHub token for API access |
| `pr_comment` | ❌ | `true` | Post PR comments |
| `fail_on_count` | ❌ | - | Fail if total findings exceed count |
| `ignore_rule_ids` | ❌ | - | Comma-separated rule IDs to ignore |
| `ignore_paths` | ❌ | - | Glob patterns for paths to ignore |
| `deduplicate` | ❌ | `true` | Deduplicate findings |
| `baseline_file` | ❌ | - | SARIF baseline for comparison |

## Outputs

| Output | Description |
|--------|-------------|
| `total_findings` | Total number of findings |
| `critical_count` | Critical severity count |
| `high_count` | High severity count |
| `medium_count` | Medium severity count |
| `low_count` | Low severity count |
| `quality_gate_status` | `PASS` or `FAIL` |

## Supported Scanners

- **CodeQL** - GitHub's semantic code analysis
- **Trivy** - Comprehensive vulnerability scanner
- **Snyk** - Open source security platform
- **Semgrep** - Fast, syntax-aware semantic code analysis
- **Checkov** - Infrastructure as Code scanner
- **Grype** - Vulnerability scanner for SBOM
- **Any SARIF 2.1.0 compliant tool**

## Examples

### Basic Usage

```yaml
- uses: your-org/QualityGate@v1
  with:
    sarif_file: results.sarif
    severity_threshold: medium
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Multiple Files

```yaml
- uses: your-org/QualityGate@v1
  with:
    sarif_file: |
      results/codeql.sarif
      results/trivy.sarif
      results/snyk.sarif
    severity_threshold: high
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Advanced Configuration

```yaml
- uses: your-org/QualityGate@v1
  with:
    sarif_file: results/*.sarif
    severity_threshold: critical
    fail_on_count: 10
    ignore_rule_ids: rule-1,rule-2
    ignore_paths: test/**,vendor/**
    deduplicate: true
    github_token: ${{ secrets.GITHUB_TOKEN }}
    pr_comment: true
```

### With CodeQL

```yaml
- name: Initialize CodeQL
  uses: github/codeql-action/init@v3
  with:
    languages: javascript

- name: Autobuild
  uses: github/codeql-action/autobuild@v3

- name: Analyze
  uses: github/codeql-action/analyze@v3
  with:
    output: sarif-results

- name: Quality Gate
  uses: your-org/QualityGate@v1
  with:
    sarif_file: sarif-results/javascript.sarif
    severity_threshold: high
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

### With Trivy

```yaml
- name: Scan container
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'image'
    scan-ref: 'alpine:latest'
    format: 'sarif'
    output: 'trivy-results.sarif'

- name: Quality Gate
  uses: your-org/QualityGate@v1
  with:
    sarif_file: trivy-results.sarif
    severity_threshold: high
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

## PR Comments

### Failed Quality Gate

# ❌ Quality Gate Failed

Findings exceeded the **high** severity threshold.

## Summary

| Severity | Count |
| -------- | ----- |
| 🔴 Critical | 2     |
| 🟠 High     | 5     |
| 🟡 Medium   | 3     |
| 🔵 Low      | 1     |

## Findings

| Severity | Rule | File | Line | Message |
| -------- | ---- | ---- | ---- | ------- |
| 🔴 critical | CWE-79 | src/index.html | 15 | Cross-site scripting vulnerability |
| 🔴 critical | CWE-89 | src/db.js | 42 | SQL injection vulnerability |

### Passed Quality Gate

# ✅ Quality Gate Passed

No findings exceeded configured threshold.

## Summary

| Severity | Count |
| -------- | ----- |
| 🔴 Critical | 0     |
| 🟠 High     | 0     |
| 🟡 Medium   | 2     |
| 🔵 Low      | 5     |

## Architecture

```
QualityGate/
├── action.yml          # Action metadata
├── src/
│   ├── index.ts        # Main entry point
│   ├── types/sarif.ts  # SARIF type definitions
│   ├── parser/         # SARIF parsing logic
│   ├── quality/        # Quality evaluation
│   ├── github/         # GitHub API integration
│   ├── utils/          # Utilities
│   └── formatters/     # Output formatting
├── tests/              # Unit tests
└── dist/               # Compiled JavaScript
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Lint
npm run lint

# Package for distribution
npm run package
```

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Test action locally
npm run test:action
```

## Compatibility

- ✅ **Node.js**: 20.x
- ✅ **GitHub**: Enterprise and Public
- ✅ **SARIF**: 2.1.0 specification
- ✅ **Runners**: GitHub-hosted and self-hosted
- ✅ **Permissions**: `contents: read`, `pull-requests: write`

## Security

- No external API dependencies
- Pure SARIF file processing
- No secrets or sensitive data handling
- Enterprise-compatible token handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://github.com/your-org/QualityGate)
- 🐛 [Issues](https://github.com/your-org/QualityGate/issues)
- 💬 [Discussions](https://github.com/your-org/QualityGate/discussions)