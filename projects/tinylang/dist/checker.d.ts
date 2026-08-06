import type { Expr, FuncDecl, Param, Program, Statement, TypeName } from "./ast.ts";
import type { Diagnostic } from "./diagnostics.ts";
import type { BuiltinName } from "./emitter.ts";
import type { Scope } from "./scope.ts";
export type ExprType = TypeName | "void";
export type CheckResult = {
    readonly ok: true;
    readonly type: ExprType;
} | {
    readonly ok: false;
    readonly diagnostics: readonly Diagnostic[];
};
export type BuiltinParamType = TypeName | "any";
export type BuiltinSignature = {
    readonly params: readonly BuiltinParamType[];
    readonly returnType: ExprType;
};
export declare const BUILTIN_SIGNATURES: Readonly<Record<BuiltinName, BuiltinSignature>>;
export type FunctionSignature = {
    readonly params: readonly Param[];
    readonly returnType: TypeName;
};
export type FunctionTable = ReadonlyMap<string, FunctionSignature>;
export type CheckContext = {
    readonly functions: FunctionTable;
    readonly returnType: TypeName | null;
};
export declare function checkExpr(expr: Expr, scope: Scope, ctx: CheckContext): CheckResult;
export declare function checkStatement(stmt: Statement, scope: Scope, ctx: CheckContext): readonly Diagnostic[];
export declare function checkFuncDecl(func: FuncDecl, outerScope: Scope, functions: FunctionTable): readonly Diagnostic[];
export declare function checkProgram(program: Program): readonly Diagnostic[];
