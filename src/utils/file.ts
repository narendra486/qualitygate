import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import { glob } from 'fast-glob';
import { minimatch } from 'minimatch';

export class FileHandler {
    static readFile(filePath: string): string {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            const content = fs.readFileSync(filePath, 'utf-8');
            core.debug(`Read file: ${filePath} (${content.length} bytes)`);
            return content;
        } catch (error) {
            throw new Error(`Failed to read file ${filePath}: ${error}`);
        }
    }

    static parseJson<T>(content: string, filePath?: string): T {
        try {
            return JSON.parse(content);
        } catch (error) {
            throw new Error(`Failed to parse JSON${filePath ? ` from ${filePath}` : ''}: ${error}`);
        }
    }

    static async expandGlob(pattern: string): Promise<string[]> {
        try {
            const files = await glob(pattern, { onlyFiles: true });
            core.debug(`Glob pattern "${pattern}" matched ${files.length} file(s)`);
            return files;
        } catch (error) {
            core.warning(`Failed to expand glob pattern "${pattern}": ${error}`);
            return [];
        }
    }

    static resolvePaths(patterns: string[]): string[] {
        const resolved: string[] = [];

        for (const pattern of patterns) {
            if (fs.existsSync(pattern)) {
                resolved.push(pattern);
            } else {
                core.debug(`Path does not exist: ${pattern}`);
            }
        }

        return resolved;
    }

    static shouldIgnore(filePath: string, ignorePatterns: string[]): boolean {
        for (const pattern of ignorePatterns) {
            if (minimatch(filePath, pattern)) {
                return true;
            }
        }
        return false;
    }
}