# QualityGate

**QualityGate - Universal SARIF Security Quality Gate**

Lightweight GitHub Action for enforcing SARIF-based security quality gates. It works from SARIF files only and does not require GitHub Advanced Security APIs.

## Usage

```yaml
- name: QualityGate
  uses: narendra486/qualitygate@v1
  with:
    sarif_file: codeql-results.sarif
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

Default behavior:

- `severity_threshold: high`
- `mode: block`
- `pr_comment: true`
- `deduplicate: true`
- `enable_annotations: true`
- `enable_step_summary: true`

Default `severity_threshold: high` blocks high and critical findings. To also block medium findings:

```yaml
- name: QualityGate
  uses: narendra486/qualitygate@v1
  with:
    sarif_file: codeql-results.sarif
    severity_threshold: medium
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input | Required | Default | Description |
| ----- | -------- | ------- | ----------- |
| `sarif_file` | Yes | | SARIF file, directory, glob, or multiline list. |
| `severity_threshold` | No | `high` | `low`, `medium`, `high`, or `critical`. |
| `mode` | No | `block` | `block` exits with failure; `report` comments without failing. |
| `github_token` | No | | Token for PR comments and check runs. |
| `pr_comment` | No | `true` | Set `false` to disable PR comments. |
| `fail_on_count` | No | | Fail if total findings exceed this integer. |
| `ignore_rule_ids` | No | | Comma-separated rule IDs to ignore. |
| `ignore_paths` | No | | Comma-separated glob patterns to ignore. |
| `deduplicate` | No | `true` | Set `false` to count every scanner occurrence. |
| `enable_annotations` | No | `true` | Emit GitHub workflow annotations. |
| `enable_step_summary` | No | `true` | Write GitHub Step Summary. |
| `markdown_template` | No | | Optional custom PR comment template path. |
| `max_findings_display` | No | `100` | Maximum findings shown in PR comment. |
| `json_export_file` | No | | Optional JSON report path. |

## Outputs

| Output | Description |
| ------ | ----------- |
| `total_findings` | Total findings after filtering and deduplication. |
| `critical_count` | Critical finding count. |
| `high_count` | High finding count. |
| `medium_count` | Medium finding count. |
| `low_count` | Low finding count. |
| `quality_gate_status` | `PASS` or `FAIL`. |
| `blocked` | `true` when policy failed. |
| `processed_files` | Newline-separated processed SARIF files. |

## Blocking

```yaml
mode: block
```

`block` is the default. When policy fails, QualityGate calls `core.setFailed()` and `process.exit(1)`.

```yaml
mode: report
```

`report` posts results and exits successfully.

## Severity Logic

| Threshold | Fails on |
| --------- | -------- |
| `critical` | critical |
| `high` | high, critical |
| `medium` | medium, high, critical |
| `low` | low, medium, high, critical |

SARIF levels are normalized as:

| SARIF level | Severity |
| ----------- | -------- |
| `error` | `high` |
| `warning` | `medium` |
| `note` / `none` | `low` |

Numeric security severity values are normalized as CVSS-like scores: `>=9 critical`, `>=7 high`, `>=4 medium`, `>0 low`.

## CodeQL Example

```yaml
name: CodeQL Security Scan

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read
  pull-requests: write
  security-events: read
  checks: write

jobs:
  codeql:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - uses: github/codeql-action/init@v4
        with:
          languages: javascript

      - uses: github/codeql-action/autobuild@v4

      - uses: github/codeql-action/analyze@v4
        with:
          output: codeql-results.sarif

      - name: QualityGate
        uses: narendra486/qualitygate@v1
        with:
          sarif_file: codeql-results.sarif
          severity_threshold: medium
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Error Format

QualityGate uses GitHub-native annotations:

```text
[QG004] Quality Gate failed: ❌ FAIL | Threshold: high | Critical: 0 | High: 1 | Medium: 0 | Low: 0
```

| Code | Level | Meaning |
| ---- | ----- | ------- |
| `QG001` | Error | Invalid input. |
| `QG002` | Error | No SARIF files found. |
| `QG003` | Warning | Malformed SARIF skipped or parsed best-effort. |
| `QG004` | Error | Quality gate policy failed. |
| `QG005` | Warning | GitHub integration warning. |
| `QG006` | Warning | Step summary warning. |
| `QG007` | Warning | SARIF file discovery warning. |
| `QG999` | Error | Unexpected action failure. |

## Development

```bash
npm ci
npm run lint
npm test
npm run package
```

## License

MIT
