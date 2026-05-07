import * as core from '@actions/core';

export class Logger {
    static info(message: string): void {
        core.info(message);
    }

    static debug(message: string): void {
        core.debug(message);
    }

    static warning(message: string): void {
        core.warning(message);
    }

    static error(message: string): void {
        core.error(message);
    }

    static startGroup(name: string): void {
        core.startGroup(name);
    }

    static endGroup(): void {
        core.endGroup();
    }

    static logObject(label: string, obj: any): void {
        core.debug(`${label}: ${JSON.stringify(obj, null, 2)}`);
    }
}