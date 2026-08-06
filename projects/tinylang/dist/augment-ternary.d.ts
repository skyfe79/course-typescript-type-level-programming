declare module "./ast.ts" {
    interface ExprRegistry {
        ternary: {
            readonly kind: "ternary";
            readonly condition: Expr;
            readonly whenTrue: Expr;
            readonly whenFalse: Expr;
        };
    }
}
export {};
