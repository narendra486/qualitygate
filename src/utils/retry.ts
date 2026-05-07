import * as core from '@actions/core';

export interface RetryOptions {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
}

export class RetryHandler {
    static async execute<T>(
        fn: () => Promise<T>,
        options: RetryOptions = {}
    ): Promise<T> {
        const maxAttempts = options.maxAttempts || 3;
        const delayMs = options.delayMs || 1000;
        const backoffMultiplier = options.backoffMultiplier || 2;

        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                core.debug(`Attempt ${attempt} of ${maxAttempts}`);
                return await fn();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                if (attempt < maxAttempts) {
                    const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
                    core.debug(`Retry attempt ${attempt} failed: ${lastError.message}. Waiting ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError || new Error('Unknown error');
    }
}