"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileHandler = void 0;
const fs = __importStar(require("fs"));
const core = __importStar(require("@actions/core"));
const fast_glob_1 = require("fast-glob");
const minimatch_1 = require("minimatch");
class FileHandler {
    static readFile(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }
            const content = fs.readFileSync(filePath, 'utf-8');
            core.debug(`Read file: ${filePath} (${content.length} bytes)`);
            return content;
        }
        catch (error) {
            throw new Error(`Failed to read file ${filePath}: ${error}`);
        }
    }
    static parseJson(content, filePath) {
        try {
            return JSON.parse(content);
        }
        catch (error) {
            throw new Error(`Failed to parse JSON${filePath ? ` from ${filePath}` : ''}: ${error}`);
        }
    }
    static async expandGlob(pattern) {
        try {
            const files = await (0, fast_glob_1.glob)(pattern, { onlyFiles: true });
            core.debug(`Glob pattern "${pattern}" matched ${files.length} file(s)`);
            return files;
        }
        catch (error) {
            core.warning(`Failed to expand glob pattern "${pattern}": ${error}`);
            return [];
        }
    }
    static resolvePaths(patterns) {
        const resolved = [];
        for (const pattern of patterns) {
            if (fs.existsSync(pattern)) {
                resolved.push(pattern);
            }
            else {
                core.debug(`Path does not exist: ${pattern}`);
            }
        }
        return resolved;
    }
    static shouldIgnore(filePath, ignorePatterns) {
        for (const pattern of ignorePatterns) {
            if ((0, minimatch_1.minimatch)(filePath, pattern)) {
                return true;
            }
        }
        return false;
    }
}
exports.FileHandler = FileHandler;
