// 리터럴과 식별자가 채워진 뒤, 아홉 단계 전체가 실제 소스에서 만드는 식 트리를 관찰한다.

import type { Expr } from "./src/ast.ts";
import type { Diagnostic } from "./src/diagnostics.ts";
import { tokenize } from "./src/lexer.ts";
import { createParser } from "./src/parser.ts";

// 앞의 관찰 스크립트와 마찬가지로 이 파일만 실행해도 중첩 구조를 읽을 수 있도록
// 요약 함수를 따로 둔다. Expr의 모든 갈래를 나누므로 새 변형을 빠뜨리면 반환 타입이
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
      return `call(${expr.callee}${expr.args.length === 0 ? "" : `, ${expr.args.map(describeExpr).join(", ")}`})`;
  }
}

function describeDiagnostic(diagnostic: Diagnostic): string {
  return `실패: ${diagnostic.severity} ${diagnostic.message} (줄 ${diagnostic.line}, 오프셋 ${diagnostic.offset})`;
}

function parse(source: string): Expr | undefined {
  const result = createParser(tokenize(source).tokens).parseExpression();
  if (!result.ok) {
    console.log(describeDiagnostic(result.diagnostic));
    return undefined;
  }

  return result.value;
}

// 오늘의 목표 식에서는 곱셈이 덧셈의 오른쪽 자식으로 먼저 묶인다. 요약과 전체
// 객체를 나란히 출력해 한 줄의 중첩이 kind·operator·left·right 필드에 대응함을 본다.
const goalSource = "1 + 2 * 3";
console.log(`=== 오늘의 목표 식: ${goalSource} ===`);
const goalExpression = parse(goalSource);
if (goalExpression !== undefined) {
  console.log(describeExpr(goalExpression));
  console.log("\n전체 트리 JSON:");
  console.log(JSON.stringify(goalExpression, null, 2));
}

// 토큰은 숫자·문자열·불리언 키워드·식별자로 갈라져 있어도, AST에서는 앞의 세 값이
// 모두 literal 한 갈래로 모인다. JSON.stringify 덕분에 문자열에만 따옴표가 남으므로
// true와 false가 문자열이 아니라 실제 boolean 값이라는 차이도 출력에서 드러난다.
const primarySources = ["42", '"tinylang"', "true", "false", "count"];
console.log("\n=== 네 종류 리터럴과 식별자 ===");
for (const source of primarySources) {
  const expression = parse(source);
  if (expression !== undefined) console.log(`${source} -> ${describeExpr(expression)}`);
}

// parseExpression부터 primary까지 아홉 단계가 차례로 호출되고, 실제 연산이 있는
// 레벨에서는 각기 자기보다 강한 레벨이 만든 식을 피연산자로 받아 중첩한다.
const fullChainSource = "count * 2 + 1 >= 10 && !(flag == false)";
console.log(`\n=== 아홉 단계 전체 체인: ${fullChainSource} ===`);
const fullChain = parse(fullChainSource);
if (fullChain !== undefined) console.log(describeExpr(fullChain));

// 제어 키워드 let은 primary가 받아들일 수 있는 식이 아니다. 같은 문제를 이제
// ParseResult의 위치가 분리된 Diagnostic 값으로 확인한다.
const invalidSource = "let";
console.log(`\n=== 표현식이 아닌 토큰: ${invalidSource} ===`);
parse(invalidSource);

// 아래 객체들은 JavaScript에서는 평범한 값이지만 Expr 계약으로는 잘못된 트리다.
// 관찰 출력을 모두 마친 뒤에 두어 실행 흐름을 방해하지 않으며, 억제 주석을 지우면
// TypeScript가 각 operator 자리에 허용된 리터럴 유니온을 그대로 알려 준다.
const impossibleBinary: Expr = {
  kind: "binary",
  // @ts-expect-error - Type '"**"' is not assignable to type 'BinaryOperator'
  operator: "**",
  left: { kind: "literal", value: 2 },
  right: { kind: "literal", value: 3 },
};

const impossibleUnary: Expr = {
  kind: "unary",
  // @ts-expect-error - Type '"+"' is not assignable to type 'UnaryOperator'
  operator: "+",
  operand: { kind: "literal", value: 1 },
};
