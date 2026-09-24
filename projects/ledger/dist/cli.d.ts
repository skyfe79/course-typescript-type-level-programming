import type { Interpreter } from "./interpreter.ts";
type Command = {
    kind: "add";
    args: string[];
} | {
    kind: "report";
    args: string[];
} | {
    kind: "budget";
    args: string[];
} | {
    kind: "replay";
    args: string[];
};
declare function parseCommand(argv: string[]): Command;
declare const JOURNAL_PATH = "journal.json";
declare const RUN_LOG_PATH = "run-log.json";
declare function runAdd(args: readonly string[], run: Interpreter): void;
declare function runReport(run: Interpreter): void;
declare function takeFlags(args: readonly string[]): {
    rest: string[];
    dryRun: boolean;
    record: boolean;
};
export type { Command };
export { JOURNAL_PATH, RUN_LOG_PATH, parseCommand, runAdd, runReport, takeFlags };
