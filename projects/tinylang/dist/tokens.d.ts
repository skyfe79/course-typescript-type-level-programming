import type { Line, Offset } from "./diagnostics.ts";
export type Keyword = "let" | "fn" | "if" | "else" | "while" | "return" | "true" | "false";
export type Operator = "+" | "-" | "*" | "/" | "%" | "==" | "!=" | "<" | "<=" | ">" | ">=" | "&&" | "||" | "!" | "=";
export type Punct = "(" | ")" | "{" | "}" | "," | ";" | ":";
export type TokenValue = {
    readonly kind: "number";
    readonly value: number;
} | {
    readonly kind: "string";
    readonly value: string;
} | {
    readonly kind: "identifier";
    readonly name: string;
} | {
    readonly kind: "keyword";
    readonly word: Keyword;
} | {
    readonly kind: "operator";
    readonly op: Operator;
} | {
    readonly kind: "punct";
    readonly char: Punct;
} | {
    readonly kind: "eof";
};
export type SourcePosition = {
    readonly offset: Offset;
    readonly line: Line;
};
export type Token = TokenValue & SourcePosition;
export type TokenKind = Token["kind"];
