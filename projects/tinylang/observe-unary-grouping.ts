// 전위 단항 연산자와 괄호가 우선순위 체인의 가장 안쪽에서 만드는 트리를 관찰한다.

import type { Expr } from "./src/ast.ts";
import { tokenize } from "./src/lexer.ts";
import { createParser } from "./src/parser.ts";

// 각 관찰 스크립트가 독립적으로 실행될 수 있도록 observe-precedence와 같은 요약을
// 이 파일에도 둔다. Expr의 모든 갈래를 나누므로 새 변형을 빠뜨리면 컴파일러가
// 알려 주고, 타입 단언이나 임의의 기본 분기는 필요하지 않다.
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
      return `call(${expr.callee}, ${expr.args.map(describeExpr).join(", ")})`;
  }
}

function parse(source: string): Expr {
  return createParser(tokenize(source).tokens).parseExpression();
}

const unarySource = "-1";
console.log(`=== 전위 단항 연산자: ${unarySource} ===`);
console.log(describeExpr(parse(unarySource)));

// 전위 단항은 오른쪽 결합이므로 바깥 -의 피연산자 자리에 또 하나의 단항식이 온다.
const nestedUnarySource = "- -3";
console.log(`\n=== 단항 연산자의 자기 재귀: ${nestedUnarySource} ===`);
console.log(describeExpr(parse(nestedUnarySource)));

// 단항 레벨은 곱셈 레벨보다 안쪽에 있으므로 -2가 먼저 하나의 피연산자로 묶인다.
const strongerUnarySource = "-2 * 3";
console.log(`\n=== 단항이 곱셈보다 강하게 결합: ${strongerUnarySource} ===`);
console.log(describeExpr(parse(strongerUnarySource)));

// 두 입력을 나란히 보면 괄호가 덧셈을 먼저 완성해 곱셈의 왼쪽 자식으로 보내는
// 반면, 괄호가 없을 때에는 곱셈이 덧셈의 오른쪽 자식이 되는 차이가 드러난다.
const ungroupedSource = "1 + 2 * 3";
const groupedSource = "(1 + 2) * 3";
console.log("\n=== 괄호가 뒤집는 우선순위 ===");
console.log(`${ungroupedSource} -> ${describeExpr(parse(ungroupedSource))}`);
console.log(`${groupedSource} -> ${describeExpr(parse(groupedSource))}`);

// 괄호 안의 식은 parseExpression에서 우선순위를 다시 시작하므로 비교식 전체가
// 바깥 !의 피연산자가 된다.
const groupedComparisonSource = "!(1 < 2)";
console.log(`\n=== 괄호 안에서 우선순위 리셋: ${groupedComparisonSource} ===`);
console.log(describeExpr(parse(groupedComparisonSource)));

// 지금은 빠진 닫는 괄호를 예외로 알리지만, 다음 화에서는 이 예외가 ParseResult의
// Diagnostic 값이 된다. eof 토큰의 위치가 메시지에 들어가는 모습까지 함께 확인한다.
const missingCloseSource = "(1 + 2";
console.log(`\n=== 닫는 괄호 누락: ${missingCloseSource} ===`);
console.log("다음 화에서는 이 예외가 진단 값이 됩니다.");
try {
  parse(missingCloseSource);
} catch (error) {
  if (error instanceof Error) {
    console.log(error.message);
  } else {
    throw error;
  }
}
