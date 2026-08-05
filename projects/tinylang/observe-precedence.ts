// 같은 토큰들이 파서의 어느 우선순위 층에서 묶이는지 한 줄짜리 트리로 관찰한다.

import type { Expr } from "./src/ast.ts";
import type { Diagnostic } from "./src/diagnostics.ts";
import { tokenize } from "./src/lexer.ts";
import { createParser } from "./src/parser.ts";

// Expr의 판별 유니온을 빠짐없이 나누어, 중첩 관계가 JSON보다 한눈에 들어오는
// 문자열로 바꾼다. 새 Expr 변형이 생기면 반환되지 않은 갈래를 TypeScript가 알려
// 주므로, 타입 단언이나 임의의 기본 분기는 두지 않는다.
function describeExpr(expr: Expr): string {
  switch (expr.kind) {
    case "literal":
      return `literal(${JSON.stringify(expr.value)})`;
    case "identifier":
      return `identifier(${expr.name})`;
    case "binary":
      return `binary(${expr.operator}, ${describeExpr(expr.left)}, ${describeExpr(expr.right)})`;
    case "unary":
      return `unary(${expr.operator}, ${describeExpr(expr.operand)})`;
    case "call":
      return `call(${expr.callee}${expr.args.length === 0 ? "" : `, ${expr.args.map(describeExpr).join(", ")}`})`;
    case "ternary":
      return `ternary(${describeExpr(expr.condition)}, ${describeExpr(expr.whenTrue)}, ${describeExpr(expr.whenFalse)})`;
  }
}

function describeDiagnostic(diagnostic: Diagnostic): string {
  return `실패: ${diagnostic.severity} ${diagnostic.message} (줄 ${diagnostic.line}, 오프셋 ${diagnostic.offset})`;
}

function parse(source: string, entry: "additive" | "or"): Expr | undefined {
  const parser = createParser(tokenize(source).tokens);
  const result = entry === "additive" ? parser.parseAdditive() : parser.parseOr();
  if (!result.ok) {
    console.log(describeDiagnostic(result.diagnostic));
    return undefined;
  }

  return result.value;
}

// 처음 세 예제는 덧셈 레벨에서 시작해도 그 아래의 곱셈 레벨이 먼저 피연산자를
// 묶는다는 사실을 보여 준다. 현재 예제에는 렉싱 진단이 없으므로 토큰만 넘긴다.
const rightNestedSource = "1 + 2 * 3";
console.log(`=== 곱셈이 오른쪽에 중첩: ${rightNestedSource} ===`);
const rightNested = parse(rightNestedSource, "additive");
if (rightNested !== undefined) console.log(describeExpr(rightNested));

const leftNestedSource = "2 * 3 + 4";
console.log(`\n=== 곱셈이 왼쪽에 중첩: ${leftNestedSource} ===`);
const leftNested = parse(leftNestedSource, "additive");
if (leftNested !== undefined) console.log(describeExpr(leftNested));

// 같은 레벨의 연산자는 while이 기존 left를 새 이항 노드의 왼쪽에 다시 넣는다.
// 따라서 뺄셈 두 개는 1 - (2 - 3)이 아니라 (1 - 2) - 3으로 결합한다.
const leftAssociativeSource = "1 - 2 - 3";
console.log(`\n=== 같은 우선순위는 왼쪽 결합: ${leftAssociativeSource} ===`);
const leftAssociative = parse(leftAssociativeSource, "additive");
if (leftAssociative !== undefined) console.log(describeExpr(leftAssociative));

// 완전한 식의 진입점인 parseOr는 or부터 primary까지 여섯 이항 레벨과 두 기초
// 레벨을 차례로 통과한다. 이 입력에서는 +, <, ==가 각각 먼저 묶인 뒤 &&가 잇는다.
const fullChainSource = "1 < 2 && 3 + 4 == 7";
console.log(`\n=== 전체 우선순위 체인: ${fullChainSource} ===`);
const fullChain = parse(fullChainSource, "or");
if (fullChain !== undefined) console.log(describeExpr(fullChain));

// 마지막 예제 하나는 실제 객체 모양도 함께 출력해, 한 줄 요약의 중첩이 AST의
// readonly kind·operator·left·right 필드와 정확히 대응하는지 비교할 수 있게 한다.
console.log("\n전체 우선순위 체인의 JSON:");
if (fullChain !== undefined) console.log(JSON.stringify(fullChain, null, 2));
