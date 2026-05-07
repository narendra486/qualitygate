import * as fs from 'fs/promises';
import * as syncFs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import { glob } from 'fast-glob';
import { minimatch } from 'minimatch';
import { ErrorReporter, QualityGateIssues } from './errors';

export class FileHandler {
    static async readFile(filePath: string): Promise<string> {
        try {
            if (!syncFs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            const content = await fs.readFile(filePath, 'utf-8');
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
            const files = await glob(pattern, { absolute: true, onlyFiles: true });
            core.debug(`Glob pattern "${pattern}" matched ${files.length} file(s)`);
            return files;
        } catch (error) {
            ErrorReporter.warning(
                QualityGateIssues.fileDiscoveryWarning(`Failed to expand glob pattern "${pattern}": ${error}`)
            );
            return [];
        }
    }

    static resolvePaths(patterns: string[]): string[] {
        const resolved: string[] = [];

        for (const pattern of patterns) {
            if (syncFs.existsSync(pattern)) {
                resolved.push(path.resolve(pattern));
            } else {
                core.debug(`Path does not exist: ${pattern}`);
            }
        }

        return resolved;
    }

    static async collectSarifFilesFromPath(pathOrDir: string): Promise<string[]> {
        if (!syncFs.existsSync(pathOrDir)) {
            return [];
        }

        const stats = await fs.stat(pathOrDir);
        if (stats.isDirectory()) {
            const files = await glob(['**/*.sarif', '**/*.sarif.json'], {
                cwd: pathOrDir,
                absolute: true,
                onlyFiles: true,
            });
            core.debug(`Directory "${pathOrDir}" contains ${files.length} SARIF file(s)`);
            return files;
        }

        return [path.resolve(pathOrDir)];
    }

    static shouldIgnore(filePath: string, ignorePatterns: string[]): boolean {
        for (const pattern of ignorePatterns) {
            if (minimatch(filePath, pattern, { dot: true }) || minimatch(path.basename(filePath), pattern, { dot: true })) {
                return true;
            }
        }
        return false;
    }

    static async writeJson(filePath: string, data: unknown): Promise<void> {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
    }
}
