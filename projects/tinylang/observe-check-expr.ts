// 실제 소스를 렉싱하고 파싱한 식을 검사기에 넘겨, 각 타입 규칙의 결과를 관찰한다.

import type { Expr } from "./src/ast.ts";
import { checkExpr } from "./src/checker.ts";
import type {
  CheckContext,
  CheckResult,
  FunctionSignature,
  FunctionTable,
} from "./src/checker.ts";
import type { Diagnostic } from "./src/diagnostics.ts";
import { tokenize } from "./src/lexer.ts";
import { createParser } from "./src/parser.ts";
import { createScope, declare } from "./src/scope.ts";
import type { Scope } from "./src/scope.ts";

function describeDiagnostic(diagnostic: Diagnostic): string {
  return `${diagnostic.severity}: ${diagnostic.message}`;
}

function describeResult(result: CheckResult): string {
  if (result.ok) return `{ ok: true, type: ${result.type} }`;

  return `{ ok: false, diagnostics: [${result.diagnostics.map(describeDiagnostic).join(", ")}] }`;
}

// 관찰 대상은 손으로 만든 AST가 아니라 렉서와 파서가 실제로 만든 식이다. 두 앞 단계의
// 실패도 Result의 판별자를 확인해 출력하므로, 잘못된 입력이 검사기까지 흘러가지 않는다.
function parseExpression(source: string): Expr | undefined {
  const lexed = tokenize(source);
  if (lexed.diagnostics.length > 0) {
    console.log(`${source} → 렉싱 실패: ${lexed.diagnostics.map(describeDiagnostic).join(", ")}`);
    return undefined;
  }

  const parsed = createParser(lexed.tokens).parseExpression();
  if (!parsed.ok) {
    console.log(`${source} → 파싱 실패: ${describeDiagnostic(parsed.diagnostic)}`);
    return undefined;
  }

  return parsed.value;
}

function observe(source: string, scope: Scope, ctx: CheckContext): CheckResult | undefined {
  const expression = parseExpression(source);
  if (expression === undefined) return undefined;

  const result = checkExpr(expression, scope, ctx);
  console.log(`${source} → ${describeResult(result)}`);
  return result;
}

const scope = createScope(null);
const emptyFunctions: FunctionTable = new Map<string, FunctionSignature>();
const emptyContext: CheckContext = { functions: emptyFunctions };

console.log("=== 리터럴 산술 검사 ===");
observe("1 + 2", scope, emptyContext);
observe('1 + "hi"', scope, emptyContext);

console.log("\n=== 스코프 이름 검사 ===");
declare(scope, "x", { type: "number", kind: "let" });
observe("x * 2", scope, emptyContext);
observe("y", scope, emptyContext);

console.log("\n=== 비교 검사 ===");
observe("1 < 2", scope, emptyContext);
observe('"a" == "b"', scope, emptyContext);
observe('1 == "a"', scope, emptyContext);

console.log("\n=== 단항 검사 ===");
observe("!true", scope, emptyContext);
observe('-"hi"', scope, emptyContext);

console.log("\n=== 함수 호출 검사 ===");
const functions: FunctionTable = new Map<string, FunctionSignature>([
  [
    "add",
    {
      params: [
        { name: "a", typeAnnotation: "number" },
        { name: "b", typeAnnotation: "number" },
      ],
      returnType: "number",
    },
  ],
]);
const functionContext: CheckContext = { functions };
observe("add(1, 2)", scope, functionContext);
observe("add(1)", scope, functionContext);
observe('add(1, "hi")', scope, functionContext);

console.log("\n=== 연쇄 오류 억제 ===");
const propagated = observe("y + 1", scope, emptyContext);
if (propagated !== undefined && !propagated.ok) {
  console.log(`y + 1의 진단 개수 → ${propagated.diagnostics.length}개`);
}
