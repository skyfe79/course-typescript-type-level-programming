export declare const offsetBrand: unique symbol;
export type Offset = number & {
    readonly [offsetBrand]: true;
};
export declare function toOffset(n: number): Offset;
export declare const lineBrand: unique symbol;
export type Line = number & {
    readonly [lineBrand]: true;
};
export declare function toLine(n: number): Line;
export type Severity = "error" | "warning";
export type Diagnostic = {
    readonly severity: Severity;
    readonly message: string;
    readonly offset: Offset;
    readonly line: Line;
};
export declare function makeDiagnostic(severity: Severity, message: string, offset: Offset, line: Line): Diagnostic;
