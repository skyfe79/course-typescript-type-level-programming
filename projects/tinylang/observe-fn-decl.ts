// 이름·매개변수·반환 타입·블록이 하나의 FuncDecl로 묶이는 과정을 관찰한다.

import type { Expr, FuncDecl, Statement } from "./src/ast.ts";
import type { Diagnostic } from "./src/diagnostics.ts";
import { tokenize } from "./src/lexer.ts";
import { createParser } from "./src/parser.ts";

// 수강생이 이 파일 하나만 열어도 함수 본문에 들어간 식의 모양을 읽을 수 있도록,
// observe-statements.ts의 식 요약 함수를 이 파일에도 그대로 둔다.
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

function indent(text: string): string {
  return text.split("\n").map((line) => `  ${line}`).join("\n");
}

// 함수 본문이 기존 문 파서를 그대로 통과했는지 확인할 수 있도록,
// observe-statements.ts의 일곱 갈래 요약도 같은 모양으로 복사해 둔다.
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

// 시그니처 한 줄에 이름, 각 매개변수의 이름과 타입, 반환 타입, 본문 문 개수를
// 함께 놓는다. 아래 사례들을 나란히 실행하면 목록의 0개·1개·N개 차이가 바로 보인다.
function describeFuncDecl(declaration: FuncDecl): string {
  const params = declaration.params
    .map((param) => `${param.name}: ${param.typeAnnotation}`)
    .join(", ");
  return `funcDecl ${declaration.name}(${params}): ${declaration.returnType} { 본문 문 ${declaration.body.statements.length}개 }`;
}

function describeDiagnostic(diagnostic: Diagnostic): string {
  return `실패: ${diagnostic.severity} ${diagnostic.message} (줄 ${diagnostic.line}, 오프셋 ${diagnostic.offset})`;
}

// 렉서의 토큰을 함수 선언 파서에 바로 건넨다. 실패는 예외가 아니라 진단을 담은
// 값이므로 if 한 번으로 성공과 실패를 나누고, 진단도 한 줄에 모두 드러낸다.
function parse(source: string): FuncDecl | undefined {
  const result = createParser(tokenize(source).tokens).parseFnDecl();
  if (!result.ok) {
    console.log(describeDiagnostic(result.diagnostic));
    return undefined;
  }

  console.log(describeFuncDecl(result.value));
  return result.value;
}

// 매개변수 두 개, 반환 타입, 본문 블록
const addSource = "fn add(a: number, b: number): number { return a + b; }";
console.log(`=== 매개변수 두 개와 반환 타입: ${addSource} ===`);
const addDeclaration = parse(addSource);

// 빈 매개변수 배열
const noParamsSource = "fn ready(): boolean { return true; }";
console.log(`\n=== 매개변수가 하나도 없는 함수: ${noParamsSource} ===`);
parse(noParamsSource);

// 매개변수 하나: 콤마 반복은 0회
const oneParamSource = "fn negate(value: boolean): boolean { return !value; }";
console.log(`\n=== 매개변수가 하나뿐인 함수: ${oneParamSource} ===`);
parse(oneParamSource);

// 기존 if와 while이 들어간 함수 본문
const statementsSource = "fn count(limit: number): number { let total: number = 0; if (limit < 0) { return total; } while (total < limit) { total = total + 1; } return total; }";
console.log(`\n=== parseBlock이 재사용하는 if와 while: ${statementsSource} ===`);
const statementsDeclaration = parse(statementsSource);
if (statementsDeclaration !== undefined) {
  console.log(describeStatement(statementsDeclaration.body));
}

// 실패: 매개변수 타입 어노테이션 누락
const missingParamTypeSource = "fn add(a, b): number { return a + b; }";
console.log(`\n=== 매개변수 타입 어노테이션 누락: ${missingParamTypeSource} ===`);
parse(missingParamTypeSource);

// 실패: 반환 타입 앞 콜론 누락
const missingReturnColonSource = "fn add(a: number) { return a; }";
console.log(`\n=== 반환 타입 콜론 누락: ${missingReturnColonSource} ===`);
parse(missingReturnColonSource);

// 마지막에는 요약 문자열이 숨긴 실제 params 배열까지 눈으로 확인한다.
if (addDeclaration !== undefined) {
  console.log("\n=== 실제 FuncDecl 전체 값 ===");
  console.log(JSON.stringify(addDeclaration, null, 2));
}
