export type TypeName = "number" | "string" | "boolean";
export type BinaryOperator = "+" | "-" | "*" | "/" | "%" | "==" | "!=" | "<" | "<=" | ">" | ">=" | "&&" | "||";
export type UnaryOperator = "-" | "!";
export interface ExprRegistry {
    literal: {
        readonly kind: "literal";
        readonly value: number | string | boolean;
    };
    identifier: {
        readonly kind: "identifier";
        readonly name: string;
    };
    binary: {
        readonly kind: "binary";
        readonly operator: BinaryOperator;
        readonly left: Expr;
        readonly right: Expr;
    };
    unary: {
        readonly kind: "unary";
        readonly operator: UnaryOperator;
        readonly operand: Expr;
    };
    call: {
        readonly kind: "call";
        readonly callee: string;
        readonly args: readonly Expr[];
    };
}
export type Expr = ExprRegistry[keyof ExprRegistry];
export type Block = {
    readonly kind: "block";
    readonly statements: readonly Statement[];
};
export type IfStatement = {
    readonly kind: "if";
    readonly condition: Expr;
    readonly thenBranch: Block;
    readonly elseBranch: Block | IfStatement | null;
};
export type Statement = Block | IfStatement | {
    readonly kind: "varDecl";
    readonly name: string;
    readonly declaredType: TypeName;
    readonly initializer: Expr;
} | {
    readonly kind: "assignment";
    readonly name: string;
    readonly value: Expr;
} | {
    readonly kind: "while";
    readonly condition: Expr;
    readonly body: Block;
} | {
    readonly kind: "return";
    readonly value: Expr;
} | {
    readonly kind: "exprStatement";
    readonly expression: Expr;
};
export type Param = {
    readonly name: string;
    readonly typeAnnotation: TypeName;
};
export type FuncDecl = {
    readonly kind: "funcDecl";
    readonly name: string;
    readonly params: readonly Param[];
    readonly returnType: TypeName;
    readonly body: Block;
};
export type Program = {
    readonly kind: "program";
    readonly functions: readonly FuncDecl[];
    readonly statements: readonly Statement[];
};
export type AstNode = Expr | Statement | FuncDecl | Program;
