import type { EffectCommand, Interpreter } from "./interpreter.ts";
type LogEntry = {
    readonly command: EffectCommand;
    readonly result?: string;
};
type RunLog = {
    readonly argv: readonly string[];
    readonly entries: readonly LogEntry[];
};
declare function recordCommand(cmd: EffectCommand, entries: LogEntry[]): string | void;
declare function saveRunLog(path: string, log: RunLog): void;
declare function loadRunLog(path: string): RunLog;
declare function makeReplayInterpreter(log: RunLog): Interpreter;
export type { LogEntry, RunLog };
export { loadRunLog, makeReplayInterpreter, recordCommand, saveRunLog };
