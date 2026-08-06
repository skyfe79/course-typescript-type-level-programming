import type { Block, Expr, FuncDecl, IfStatement, Param, Program, Statement } from "./ast.ts";
import type { Diagnostic } from "./diagnostics.ts";
import type { Token } from "./tokens.ts";
export type ParseResult<T> = {
    readonly ok: true;
    readonly value: T;
} | {
    readonly ok: false;
    readonly diagnostic: Diagnostic;
};
export declare function createParser(tokens: readonly Token[]): {
    parseExpression: () => ParseResult<Expr>;
    parseOr: () => ParseResult<Expr>;
    parseAnd: () => ParseResult<Expr>;
    parseEquality: () => ParseResult<Expr>;
    parseComparison: () => ParseResult<Expr>;
    parseAdditive: () => ParseResult<Expr>;
    parseMultiplicative: () => ParseResult<Expr>;
    parseUnary: () => ParseResult<Expr>;
    parsePrimary: () => ParseResult<Expr>;
    parseStatement: () => ParseResult<Statement>;
    parseBlock: () => ParseResult<Block>;
    parseIfStatement: () => ParseResult<IfStatement>;
    parseWhileStatement: () => ParseResult<Statement>;
    parseFnDecl: () => ParseResult<FuncDecl>;
    parseParam: () => ParseResult<Param>;
    parseProgram: () => ParseResult<Program>;
};
