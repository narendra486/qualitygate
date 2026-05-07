import * as core from '@actions/core';
import { MarkdownContext, MarkdownFormatter } from '../formatters/markdown';
import { ErrorReporter, QualityGateIssues } from '../utils/errors';

export class StepSummaryHandler {
    private readonly formatter = new MarkdownFormatter();

    async write(context: MarkdownContext): Promise<void> {
        try {
            await core.summary.addRaw(this.formatter.formatStepSummary(context), true).write();
            core.info('Step summary written');
        } catch (error) {
            ErrorReporter.warning(
                QualityGateIssues.stepSummaryWarning(
                    `Failed to write step summary: ${error instanceof Error ? error.message : String(error)}`
                )
            );
        }
    }
}
