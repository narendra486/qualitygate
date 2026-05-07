# QualityGate

**QualityGate - Universal SARIF Security Quality Gate**

Enterprise-grade GitHub Action for SARIF-based security quality gates supporting CodeQL, Snyk, Trivy, Semgrep, Checkov, Grype, Kubescape, DevSkim, and other SARIF 2.1.0 scanners.

QualityGate works only from SARIF files. It does not require GitHub Advanced Security APIs and works on GitHub-hosted and self-hosted runners.

## Features

- Parse SARIF 2.1.0 files from multiple scanners
- Aggregate single files, multiline lists, directories, and globs
- Support multiple SARIF runs per file
- Normalize SARIF severity across scanners
- Deduplicate findings with stable fingerprints
- Ignore configured rules and paths
- Suppress baseline findings from a baseline SARIF
- Generate professional PR comments with badges, emojis, collapsible sections, metadata, and truncation
- Generate GitHub Step Summary with threshold configuration, blocked status, duration, and processed files
- Emit GitHub workflow annotations and optional check runs
- Fail workflows with `core.setFailed()` and `process.exit(1)`
- Export machine-readable JSON reports

## Quick Start

```yaml
name: Security

on:
  pull_request:
  push:
    branches:
      - main

permissions:
  contents: read
  pull-requests: write
  checks: write

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Quality Gate
        uses: your-org/QualityGate@v1
        with:
          sarif_file: results
          severity_threshold: high
          github_token: ${{ secrets.GITHUB_TOKEN }}
          pr_comment: true
          enable_annotations: true
          enable_step_summary: true
```

## Inputs

| Input | Required | Default | Description |
| ----- | -------- | ------- | ----------- |
| `sarif_file` | Yes | | Single SARIF file, multiline list, directory, or glob. Supports `.sarif` and `.sarif.json`. |
| `severity_threshold` | Yes | `high` | One of `low`, `medium`, `high`, `critical`. |
| `github_token` | No | | Token for PR comments and optional check runs. |
| `pr_comment` | No | `true` | Post or update a PR comment. |
| `fail_on_count` | No | | Fail when total findings exceed this integer. |
| `ignore_rule_ids` | No | | Comma-separated rule IDs to ignore. |
| `ignore_paths` | No | | Comma-separated glob patterns for finding paths to ignore. |
| `deduplicate` | No | `true` | Deduplicate findings before evaluation. |
| `baseline_file` | No | | SARIF baseline file, directory, glob, or multiline list. |
| `enable_annotations` | No | `true` | Create workflow annotations for findings. |
| `enable_step_summary` | No | `true` | Write GitHub Step Summary. |
| `markdown_template` | No | | Reserved for custom enterprise markdown templates. |
| `max_findings_display` | No | `100` | Maximum findings displayed in comments and summaries. |
| `json_export_file` | No | | Optional path for a JSON report artifact. |

## Outputs

| Output | Description |
| ------ | ----------- |
| `total_findings` | Total finding count after filtering, baseline suppression, and deduplication. |
| `critical_count` | Critical finding count. |
| `high_count` | High finding count. |
| `medium_count` | Medium finding count. |
| `low_count` | Low finding count. |
| `quality_gate_status` | `PASS` or `FAIL`. |
| `blocked` | `true` when the quality gate failed. |
| `processed_files` | Newline-separated processed SARIF files. |

## Quality Gate Logic

| Threshold | Workflow fails on |
| --------- | ----------------- |
| `critical` | Critical findings |
| `high` | High and critical findings |
| `medium` | Medium, high, and critical findings |
| `low` | Low, medium, high, and critical findings |

`fail_on_count` is evaluated in addition to severity thresholding.

## Severity Normalization

| SARIF level | Normalized severity |
| ----------- | ------------------- |
| `error` | `high` |
| `warning` | `medium` |
| `note` / `none` | `low` |

Numeric security severity values are normalized as CVSS-like scores: `>=9 critical`, `>=7 high`, `>=4 medium`, `>0 low`.

## Examples

Full scanner examples are available in [docs/EXAMPLE_WORKFLOWS.md](docs/EXAMPLE_WORKFLOWS.md).

### Multiple Scanner Aggregation

```yaml
- name: Quality Gate
  uses: your-org/QualityGate@v1
  with:
    sarif_file: |
      sarif-results/codeql.sarif
      sarif-results/trivy.sarif
      sarif-results/semgrep.sarif
      sarif-results/checkov.sarif
    severity_threshold: high
    github_token: ${{ secrets.GITHUB_TOKEN }}
    pr_comment: true
    enable_annotations: true
    json_export_file: qualitygate-report.json
```

### Monorepo

```yaml
- name: Quality Gate
  uses: your-org/QualityGate@v1
  with:
    sarif_file: services/**/sarif
    severity_threshold: medium
    ignore_paths: "**/test/**,**/fixtures/**,third_party/**"
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Baseline Suppression

```yaml
- name: Quality Gate
  uses: your-org/QualityGate@v1
  with:
    sarif_file: current-results
    baseline_file: examples/baselines/baseline.sarif
    severity_threshold: high
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Reusable Workflow Caller

```yaml
jobs:
  security:
    uses: your-org/QualityGate/.github/workflows/examples.yml@v1
    permissions:
      contents: read
      pull-requests: write
      checks: write
```

## Scanner Compatibility

| Scanner | Status | Notes |
| ------- | ------ | ----- |
| CodeQL | Supported | Uses rule metadata and `security-severity` when available. |
| Trivy | Supported | Supports CVE SARIF and numeric severities. |
| Snyk | Supported | Supports Snyk SARIF severity properties. |
| Semgrep | Supported | Supports SARIF levels and rule metadata. |
| Checkov | Supported | Supports IaC SARIF output and rule IDs. |
| Grype | Supported | Supports vulnerability SARIF output. |
| Kubescape | Supported | Supports SARIF 2.1.0 output. |
| DevSkim | Supported | Supports SARIF levels and rule metadata. |
| Any SARIF 2.1.0 tool | Supported | Parsed best-effort from SARIF standard fields. |

## PR Comment Format

Failed gates produce comments like:

```markdown
# 🚨 Quality Gate Failed

## Security Summary

| Severity | Count |
| -------- | ----- |
| Critical | 2 |
| High | 5 |
| Medium | 7 |
| Low | 10 |

## Findings

| Severity | Rule | File | Line | Message |
| -------- | ---- | ---- | ---- | ------- |
```

Passed gates produce:

```markdown
# ✅ Quality Gate Passed

No findings exceeded configured threshold.
```

The generated comment also includes shield badges, scanner metadata, processed SARIF files, execution duration, collapsible grouped findings, and truncation when findings exceed `max_findings_display`.

## Enterprise Deployment

Recommended permissions:

```yaml
permissions:
  contents: read
  pull-requests: write
  checks: write
```

For push-only workflows, omit `pull-requests: write` and set `pr_comment: false`.

For self-hosted runners:

- Ensure Node.js 24 compatible GitHub Actions runner support.
- Store SARIF files in the workspace before running QualityGate.
- Avoid scanner uploads as the enforcement source; QualityGate reads local SARIF files only.

## Security Considerations

- No unsafe `eval`.
- No shell execution using user-controlled inputs.
- SARIF files are read through filesystem APIs.
- GitHub API calls use retry logic and pagination.
- Workflows in this repository pin third-party actions to commit SHAs.
- Use least-privilege token permissions.
- Treat SARIF content as untrusted; QualityGate escapes markdown table-sensitive output.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Development

```bash
npm install
npm run build
npm test
npm run package
```

The marketplace entrypoint is `dist/index.js`, produced with `@vercel/ncc`.

## Troubleshooting

| Symptom | Resolution |
| ------- | ---------- |
| `No SARIF files found` | Confirm `sarif_file` points to an existing file, directory, glob, or multiline list. |
| PR comment missing | Ensure the event is `pull_request`, `github_token` is provided, and `pull-requests: write` is granted. |
| Check run missing | Grant `checks: write`; annotations still work without creating check runs. |
| Unexpected severity | Inspect SARIF `level`, `properties.security-severity`, and rule metadata. |
| Baseline not suppressing | Baseline matching uses stable fingerprints from tool, rule, file, line, and message. |
| Malformed SARIF | QualityGate skips malformed files with warnings and continues processing valid SARIF. |

## License

MIT
