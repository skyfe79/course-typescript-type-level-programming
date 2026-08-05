// 파싱 실패가 예외가 아니라 위치를 가진 값으로 돌아오는 모습을 한 파일에서 관찰한다.

import type { Expr, Statement } from "./src/ast.ts";
import { tokenize } from "./src/lexer.ts";
import { createParser } from "./src/parser.ts";

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

function describeStatement(statement: Statement): string {
  switch (statement.kind) {
    case "block":
      return `block(${statement.statements.map(describeStatement).join(", ")})`;
    case "if": {
      const elseBranch = statement.elseBranch === null
        ? "null"
        : describeStatement(statement.elseBranch);
      return `if(${describeExpr(statement.condition)}, ${describeStatement(statement.thenBranch)}, ${elseBranch})`;
    }
    case "varDecl":
      return `varDecl(${statement.name}: ${statement.declaredType} = ${describeExpr(statement.initializer)})`;
    case "assignment":
      return `assignment(${statement.name} = ${describeExpr(statement.value)})`;
    case "while":
      return `while(${describeExpr(statement.condition)}, ${describeStatement(statement.body)})`;
    case "return":
      return `return(${describeExpr(statement.value)})`;
    case "exprStatement":
      return `exprStatement(${describeExpr(statement.expression)})`;
  }
}

// 이 파일에는 예외 처리 구문이 전혀 없다. 실패는 제어 흐름이 아니라 값이므로
// 호출자는 아래의 if 한 번으로 첫 진단을 읽는다.
function observe(source: string): void {
  console.log(`입력: ${JSON.stringify(source)}`);
  const result = createParser(tokenize(source).tokens).parseStatement();

  if (!result.ok) {
    const diagnostic = result.diagnostic;
    console.log(`ok: ${result.ok}`);
    console.log(
      `진단: severity=${diagnostic.severity}, message=${diagnostic.message}, line=${diagnostic.line}, offset=${diagnostic.offset}`,
    );
    return;
  }

  console.log(`ok: ${result.ok}`);
  console.log(`값: ${describeStatement(result.value)}`);
}

console.log("=== 실패 값: 닫는 괄호 누락 ===");
observe("if (x < 10 { x = x + 1; }");

console.log("\n=== 실패 값: 닫는 중괄호 누락 ===");
observe("if (x < 10) { x = x + 1;");

console.log("\n=== 실패 값: 세미콜론 누락 ===");
observe("let x: number = 1 + 2");

console.log("\n=== 실패 값: 허용되지 않은 타입 이름 ===");
observe("let x: bignum = 1;");

console.log("\n=== 실패 값: 식 자리에 온 키워드 ===");
observe("let x: number = while;");

console.log("\n=== 실패 값: 여러 줄 입력의 위치 ===");
observe("let x: number =\n  while;");

console.log("\n=== 성공 값: 변수 선언 ===");
observe("let total: number = 1 + 2 * 3;");

console.log("\n=== 성공 값: if/else ===");
observe("if (x < 10) { x = x + 1; } else { x = 0; }");
