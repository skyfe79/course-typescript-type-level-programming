// 식 파서 위에 문 디스패치가 더해지면서 만드는 일곱 가지 Statement를 관찰한다.

import type { Expr, Statement } from "./src/ast.ts";
import type { Diagnostic } from "./src/diagnostics.ts";
import { tokenize } from "./src/lexer.ts";
import { createParser } from "./src/parser.ts";

// 관찰 스크립트 하나만 실행해도 식의 모양을 읽을 수 있도록, 기존
// observe-expression.ts의 요약 함수를 이 파일에도 그대로 둔다.
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

function indent(text: string): string {
  return text.split("\n").map((line) => `  ${line}`).join("\n");
}

// 별도의 기본 분기 없이 Statement의 일곱 갈래를 모두 나눈다. 블록의 자식 요약은
// 한 단계 들여써, if·while·중첩 블록 안에 어떤 문이 들어갔는지 눈으로 따라갈 수 있다.
function describeStatement(statement: Statement): string {
  switch (statement.kind) {
    case "block": {
      if (statement.statements.length === 0) return "block {}";
      const children = statement.statements.map(describeStatement).join("\n");
      return `block {\n${indent(children)}\n}`;
    }
    case "if": {
      const elseSummary = statement.elseBranch === null
        ? "null"
        : `\n${indent(describeStatement(statement.elseBranch))}`;
      return [
        `if (${describeExpr(statement.condition)})`,
        indent(describeStatement(statement.thenBranch)),
        `elseBranch: ${elseSummary}`,
      ].join("\n");
    }
    case "varDecl":
      return `varDecl ${statement.name}: ${statement.declaredType} = ${describeExpr(statement.initializer)}`;
    case "assignment":
      return `assignment ${statement.name} = ${describeExpr(statement.value)}`;
    case "while":
      return [
        `while (${describeExpr(statement.condition)})`,
        indent(describeStatement(statement.body)),
      ].join("\n");
    case "return":
      return `return ${describeExpr(statement.value)}`;
    case "exprStatement":
      return `exprStatement ${describeExpr(statement.expression)}`;
  }
}

function describeDiagnostic(diagnostic: Diagnostic): string {
  return `실패: ${diagnostic.severity} ${diagnostic.message} (줄 ${diagnostic.line}, 오프셋 ${diagnostic.offset})`;
}

function parse(source: string): Statement | undefined {
  const result = createParser(tokenize(source).tokens).parseStatement();
  if (!result.ok) {
    console.log(describeDiagnostic(result.diagnostic));
    return undefined;
  }

  return result.value;
}

const goalSource = "let x: number = 1 + 2;";
console.log(`=== 오늘의 목표 문: ${goalSource} ===`);
const goalStatement = parse(goalSource);
if (goalStatement !== undefined) {
  console.log(describeStatement(goalStatement));
  console.log("\n전체 트리 JSON:");
  console.log(JSON.stringify(goalStatement, null, 2));
}

const ifElseSource = "if (x < 10) { x = x + 1; } else { x = 0; }";
console.log(`\n=== if의 thenBranch와 elseBranch: ${ifElseSource} ===`);
const ifElseStatement = parse(ifElseSource);
if (ifElseStatement !== undefined) {
  console.log(describeStatement(ifElseStatement));
  console.log(JSON.stringify(ifElseStatement, null, 2));
}

const elseIfSource = "if (x < 0) { x = 0; } else if (x < 10) { x = x + 1; } else { x = 10; }";
console.log(`\n=== elseBranch에 담긴 또 다른 if: ${elseIfSource} ===`);
const elseIfStatement = parse(elseIfSource);
if (elseIfStatement !== undefined) {
  console.log(describeStatement(elseIfStatement));
  console.log(JSON.stringify(elseIfStatement, null, 2));
}

const whileSource = "while (x < 10) { x = x + 1; }";
console.log(`\n=== while의 condition과 body: ${whileSource} ===`);
const whileStatement = parse(whileSource);
if (whileStatement !== undefined) console.log(describeStatement(whileStatement));

const blockSource = "{ let total: number = 0; while (total < 3) { total = total + 1; } return total; }";
console.log(`\n=== 블록에 쌓인 여러 문: ${blockSource} ===`);
const blockStatement = parse(blockSource);
if (blockStatement !== undefined) console.log(describeStatement(blockStatement));

const invalidSource = "if (x < 10) { x = x + 1;";
console.log(`\n=== 닫는 중괄호가 없는 문: ${invalidSource} ===`);
console.log("파서는 첫 실패를 위치가 분리된 진단 값으로 돌려줍니다.");
parse(invalidSource);
