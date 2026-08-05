// 노드 순회의 완전성 검사가 컴파일 시간과 실행 시간에 각각 어떻게 작동하는지 관찰한다.

import type { Expr, Statement } from "./src/ast.ts";
import { checkExpr, checkStatement } from "./src/checker.ts";
import type {
  CheckContext,
  CheckResult,
  FunctionSignature,
  FunctionTable,
} from "./src/checker.ts";
import { createScope, declare } from "./src/scope.ts";

type FutureExpr =
  | { readonly kind: "literal" }
  | { readonly kind: "identifier" }
  | { readonly kind: "range" }; // 나중에 추가됐다고 가정하는 새 노드

function describeIncomplete(node: FutureExpr): string {
  switch (node.kind) {
    case "literal":
      return "리터럴";
    case "identifier":
      return "식별자";
    default: {
      // @ts-expect-error - range를 처리하지 않아 default에 range가 남는다. never 대입이 거절되는
      // 바로 그 오류가 "case를 빠뜨렸다"는 신호다.
      const exhaustive: never = node;
      // 억제 주석 덕분에 컴파일은 통과하지만, 실행하면 never라던 자리에 실제 값이 들어온다.
      return `처리하지 못한 종류: ${JSON.stringify(exhaustive)}`;
    }
  }
}

function describeComplete(node: FutureExpr): string {
  switch (node.kind) {
    case "literal":
      return "리터럴";
    case "identifier":
      return "식별자";
    case "range":
      return "범위";
    default: {
      // 세 갈래를 모두 처리했으므로 별도의 억제 없이도 node가 never로 좁혀진다.
      const exhaustive: never = node;
      return `처리하지 못한 종류: ${JSON.stringify(exhaustive)}`;
    }
  }
}

const futureExpressions: readonly FutureExpr[] = [
  { kind: "literal" },
  { kind: "identifier" },
  { kind: "range" },
];

console.log("=== (a) case 누락과 완전성 검사 ===");
for (const node of futureExpressions) {
  console.log(`미완성 ${node.kind} → ${describeIncomplete(node)}`);
}
for (const node of futureExpressions) {
  console.log(`완성 ${node.kind} → ${describeComplete(node)}`);
}

const functions: FunctionTable = new Map<string, FunctionSignature>([
  [
    "isPositive",
    {
      params: [{ name: "value", typeAnnotation: "number" }],
      returnType: "boolean",
    },
  ],
]);
const expressionContext: CheckContext = { functions, returnType: null };
const expressionScope = createScope(null);
declare(expressionScope, "answer", { type: "number", kind: "let" });

console.log("\n=== (b) 실행 시간의 default 방어 ===");
// 파일이나 네트워크에서 읽은 AST는 타입 단언 한 번으로 검사기 안까지 들어올 수 있으므로,
// 정적 타입을 우회한 값에 대한 이 방어는 실제 입력 경계에서도 필요하다.
const fromOutside = JSON.parse('{"kind":"range","from":1,"to":10}') as Expr;
try {
  checkExpr(fromOutside, expressionScope, expressionContext);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.log(`외부 range 식 → throw: ${message}`);
}

function describeCheckResult(result: CheckResult): string {
  if (result.ok) return `성공(${result.type})`;
  return `진단 ${result.diagnostics.length}개`;
}

const expressionCases: readonly {
  readonly label: string;
  readonly expression: Expr;
}[] = [
  { label: "literal", expression: { kind: "literal", value: 1 } },
  { label: "identifier", expression: { kind: "identifier", name: "answer" } },
  {
    label: "binary",
    expression: {
      kind: "binary",
      operator: "+",
      left: { kind: "literal", value: 1 },
      right: { kind: "literal", value: 2 },
    },
  },
  {
    label: "unary",
    expression: {
      kind: "unary",
      operator: "!",
      operand: { kind: "literal", value: true },
    },
  },
  {
    label: "call",
    expression: {
      kind: "call",
      callee: "isPositive",
      args: [{ kind: "literal", value: 1 }],
    },
  },
];

const statementScope = createScope(null);
declare(statementScope, "target", { type: "number", kind: "let" });
const statementContext: CheckContext = { functions, returnType: "number" };
const statementCases: readonly {
  readonly label: string;
  readonly statement: Statement;
}[] = [
  { label: "block", statement: { kind: "block", statements: [] } },
  {
    label: "if",
    statement: {
      kind: "if",
      condition: { kind: "literal", value: true },
      thenBranch: { kind: "block", statements: [] },
      elseBranch: null,
    },
  },
  {
    label: "varDecl",
    statement: {
      kind: "varDecl",
      name: "created",
      declaredType: "string",
      initializer: { kind: "literal", value: "tinylang" },
    },
  },
  {
    label: "assignment",
    statement: {
      kind: "assignment",
      name: "target",
      value: { kind: "literal", value: 2 },
    },
  },
  {
    label: "while",
    statement: {
      kind: "while",
      condition: { kind: "literal", value: false },
      body: { kind: "block", statements: [] },
    },
  },
  {
    label: "return",
    statement: { kind: "return", value: { kind: "literal", value: 1 } },
  },
  {
    label: "exprStatement",
    statement: {
      kind: "exprStatement",
      expression: { kind: "literal", value: true },
    },
  },
];

console.log("\n=== (c) 현재 검사기의 모든 갈래 ===");
for (const { label, expression } of expressionCases) {
  const result = checkExpr(expression, expressionScope, expressionContext);
  console.log(`Expr.${label} → ${describeCheckResult(result)}`);
}
for (const { label, statement } of statementCases) {
  const diagnostics = checkStatement(statement, statementScope, statementContext);
  console.log(`Statement.${label} → 진단 ${diagnostics.length}개`);
}
