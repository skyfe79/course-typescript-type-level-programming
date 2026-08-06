// 파서가 아직 만들지 못하는 확장 노드를 손으로 조립해, 모듈 보강이 검사기와
// 코드 생성기까지 같은 Expr 갈래를 전파했다는 사실을 실행 결과로 확인한다.

import type { Expr } from "./src/ast.ts";
import "./src/augment-ternary.ts";
import { checkExpr } from "./src/checker.ts";
import type { CheckContext, CheckResult, FunctionTable } from "./src/checker.ts";
import type { Diagnostic } from "./src/diagnostics.ts";
import { emitExpr } from "./src/emitter.ts";
import { createScope, declare } from "./src/scope.ts";

function describeDiagnostic(diagnostic: Diagnostic): string {
  return `${diagnostic.severity}: ${diagnostic.message}`;
}

function describeResult(result: CheckResult): string {
  if (result.ok) return `{ ok: true, type: ${result.type} }`;

  return `{ ok: false, diagnostics: [${result.diagnostics.map(describeDiagnostic).join(", ")}] }`;
}

const scope = createScope(null);
// 세 번째 예제는 리터럴이 아니라 실제 스코프에서 찾은 number 이름을 조건으로 쓴다.
// declare까지 거쳐야 조건식의 실패가 이름 조회 오류가 아니라 boolean 규칙에서 생긴다.
declare(scope, "count", { type: "number", kind: "let" });

const emptyFunctions: FunctionTable = new Map();
const context: CheckContext = { functions: emptyFunctions, returnType: null };

const comparison: Expr = {
  kind: "binary",
  operator: "<",
  left: { kind: "literal", value: 1 },
  right: { kind: "literal", value: 2 },
};

const valid: Expr = {
  kind: "ternary",
  condition: comparison,
  whenTrue: { kind: "literal", value: 10 },
  whenFalse: { kind: "literal", value: 20 },
};

const differentBranches: Expr = {
  kind: "ternary",
  condition: comparison,
  whenTrue: { kind: "literal", value: 10 },
  whenFalse: { kind: "literal", value: "십" },
};

const nonBooleanCondition: Expr = {
  kind: "ternary",
  condition: { kind: "identifier", name: "count" },
  whenTrue: { kind: "literal", value: 10 },
  whenFalse: { kind: "literal", value: 20 },
};

console.log("=== 올바른 삼항식: 검사 통과와 자바스크립트 생성 ===");
console.log(`검사 결과 → ${describeResult(checkExpr(valid, scope, context))}`);
console.log(`생성 결과 → ${emitExpr(valid)}`);

console.log("\n=== 두 갈래 타입이 다른 삼항식: 타입 진단 ===");
console.log(`검사 결과 → ${describeResult(checkExpr(differentBranches, scope, context))}`);

console.log("\n=== boolean이 아닌 조건의 삼항식: 조건 진단 ===");
console.log(`검사 결과 → ${describeResult(checkExpr(nonBooleanCondition, scope, context))}`);
