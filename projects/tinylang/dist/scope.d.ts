import type { TypeName } from "./ast.ts";
export type Binding = {
    readonly type: TypeName;
    readonly kind: "param" | "let";
};
export type Scope = {
    readonly bindings: Map<string, Binding>;
    readonly parent: Scope | null;
};
export declare function createScope(parent: Scope | null): Scope;
export declare function declare(scope: Scope, name: string, binding: Binding): boolean;
export type LookupResult = {
    readonly kind: "found";
    readonly binding: Binding;
} | {
    readonly kind: "not-found";
    readonly name: string;
};
export declare function lookup(scope: Scope | null, name: string): LookupResult;
