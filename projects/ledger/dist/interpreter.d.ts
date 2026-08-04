type ReadJournalCommand = {
    readonly kind: "readJournal";
    readonly path: string;
};
type WriteJournalCommand = {
    readonly kind: "writeJournal";
    readonly path: string;
    readonly content: string;
};
type ReadClockCommand = {
    readonly kind: "readClock";
};
type PrintCommand = {
    readonly kind: "print";
    readonly text: string;
};
type EffectCommand = ReadJournalCommand | WriteJournalCommand | ReadClockCommand | PrintCommand;
type Interpreter = (cmd: EffectCommand) => string | void;
declare function runCommand(cmd: EffectCommand): string | void;
export type { EffectCommand, Interpreter, ReadJournalCommand, WriteJournalCommand, ReadClockCommand, PrintCommand };
export { runCommand };
