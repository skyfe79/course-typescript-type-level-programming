import type { Diagnostic } from "./diagnostics.ts";
import type { Token } from "./tokens.ts";
export type CharClass = "digit" | "alpha" | "whitespace" | "quote" | "operator" | "punct" | "eof";
export declare function classify(ch: string | undefined): CharClass;
export type LexResult = {
    readonly tokens: readonly Token[];
    readonly diagnostics: readonly Diagnostic[];
};
export declare function tokenize(source: string): LexResult;
