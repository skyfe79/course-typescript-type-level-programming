#!/usr/bin/env node
export type Command = "check" | "build" | "run";
export type ParsedArgs = {
    readonly kind: Command;
    readonly path: string;
    readonly outPath: string | null;
} | {
    readonly kind: "usage";
    readonly reason: string | null;
};
export declare const CLI_USAGE = "\uC0AC\uC6A9\uBC95:\n  tinylang check <\uC18C\uC2A4.tl>\n  tinylang build <\uC18C\uC2A4.tl> [-o <\uCD9C\uB825.js>]\n  tinylang run <\uC18C\uC2A4.tl> [-o <\uCD9C\uB825.js>]\n\n\uBA85\uB839:\n  check  \uC18C\uC2A4\uC758 \uC624\uB958\uB97C \uAC80\uC0AC\uD569\uB2C8\uB2E4\n  build  \uC18C\uC2A4\uB97C \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8 \uD30C\uC77C\uB85C \uB9CC\uB4ED\uB2C8\uB2E4\n  run    \uC18C\uC2A4\uB97C \uC2E4\uD589\uD569\uB2C8\uB2E4\n\n\uC635\uC158:\n  -o <\uCD9C\uB825.js>  build \uB610\uB294 run\uC758 \uCD9C\uB825 \uD30C\uC77C\uC744 \uC9C0\uC815\uD569\uB2C8\uB2E4";
export declare function parseArgs(argv: readonly string[]): ParsedArgs;
export declare function dispatch(args: ParsedArgs): number;
