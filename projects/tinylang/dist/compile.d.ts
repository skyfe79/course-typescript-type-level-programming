import type { Program } from "./ast.ts";
import type { Diagnostic } from "./diagnostics.ts";
export type CompileResult = {
    readonly ok: true;
    readonly program: Program;
} | {
    readonly ok: false;
    readonly diagnostics: readonly Diagnostic[];
};
export declare function compile(source: string): CompileResult;
export declare function formatDiagnostic(diagnostic: Diagnostic): string;
