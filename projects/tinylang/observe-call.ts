// 식별자 뒤의 괄호가 호출 노드가 되고, 파일 전체가 하나의 Program으로 모이는 과정을 관찰한다.

import type { Expr, FuncDecl, Program, Statement } from "./src/ast.ts";
import type { Diagnostic } from "./src/diagnostics.ts";
import { tokenize } from "./src/lexer.ts";
import { createParser } from "./src/parser.ts";

// 수강생이 이 파일 하나만 열어도 호출의 인자 안쪽까지 읽을 수 있도록,
// observe-fn-decl.ts의 식 요약 함수를 이 파일에도 그대로 둔다.
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

function indent(text: string): string {
  return text.split("\n").map((line) => `  ${line}`).join("\n");
}

// Program의 최상위 문뿐 아니라 함수 본문도 같은 Statement 모양을 쓰므로,
// observe-fn-decl.ts의 일곱 갈래 요약을 그대로 복사해 두 곳을 함께 읽는다.
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

// 함수 목록 안에서도 시그니처와 본문 문 개수를 한눈에 확인할 수 있도록,
// observe-fn-decl.ts의 함수 선언 요약도 같은 모양으로 복사한다.
function describeFuncDecl(declaration: FuncDecl): string {
  const params = declaration.params
    .map((param) => `${param.name}: ${param.typeAnnotation}`)
    .join(", ");
  return `funcDecl ${declaration.name}(${params}): ${declaration.returnType} { 본문 문 ${declaration.body.statements.length}개 }`;
}

// Program은 소스에 등장한 순서대로 한 목록에 모두 넣지 않는다. 함수 선언과 최상위
// 문을 따로 요약해, 서로 섞여 입력되어도 두 배열로 분리되는 구조를 그대로 보여 준다.
function describeProgram(program: Program): string {
  const functions = program.functions.length === 0
    ? "    (없음)"
    : program.functions.map((declaration) => indent(indent(describeFuncDecl(declaration)))).join("\n");
  const statements = program.statements.length === 0
    ? "    (없음)"
    : program.statements.map((statement) => indent(indent(describeStatement(statement)))).join("\n");

  return [
    "program {",
    `  functions (${program.functions.length}개)`,
    functions,
    `  statements (${program.statements.length}개)`,
    statements,
    "}",
  ].join("\n");
}

function describeDiagnostic(diagnostic: Diagnostic): string {
  return `실패: ${diagnostic.severity} ${diagnostic.message} (줄 ${diagnostic.line}, 오프셋 ${diagnostic.offset})`;
}

// 호출 하나를 관찰할 때는 가장 낮은 우선순위 층부터 시작하는 식 진입점을 쓴다.
// 실패도 예외가 아니라 진단 값이므로 기존 관찰 스크립트와 같은 if로 나눈다.
function parseExpression(source: string): Expr | undefined {
  const result = createParser(tokenize(source).tokens).parseExpression();
  if (!result.ok) {
    console.log(describeDiagnostic(result.diagnostic));
    return undefined;
  }

  console.log(describeExpr(result.value));
  return result.value;
}

// 여러 함수 선언과 최상위 문을 끝까지 읽는 사례는 새 진입점 parseProgram에 맡긴다.
function parseWholeProgram(source: string): Program | undefined {
  const result = createParser(tokenize(source).tokens).parseProgram();
  if (!result.ok) {
    console.log(describeDiagnostic(result.diagnostic));
    return undefined;
  }

  console.log(describeProgram(result.value));
  return result.value;
}

// 기본 호출: 식별자 이름과 두 인자가 하나의 call 노드에 모인다.
const addSource = "add(1, 2)";
console.log(`=== 인자 두 개를 받는 호출: ${addSource} ===`);
const addCall = parseExpression(addSource);

// 빈 목록과 항목 하나: 같은 목록 파싱 코드에서 반복 횟수만 달라진다.
const readySource = "ready()";
console.log(`\n=== 인자가 없는 호출: ${readySource} ===`);
parseExpression(readySource);

const negateSource = "negate(flag)";
console.log(`\n=== 인자가 하나인 호출: ${negateSource} ===`);
parseExpression(negateSource);

// 중첩 호출: 인자도 완전한 Expr이므로 그 자리에 또 다른 call이 들어갈 수 있다.
const nestedSource = "add(mul(2, 3), 4)";
console.log(`\n=== 인자 자리에 다시 들어간 호출: ${nestedSource} ===`);
parseExpression(nestedSource);

// 호출은 primary 한 갈래이므로 곱셈과 덧셈의 기존 우선순위 층을 그대로 통과한다.
const precedenceSource = "1 + double(x) * 2";
console.log(`\n=== 연산 식 안에 섞인 호출: ${precedenceSource} ===`);
parseExpression(precedenceSource);

// 재귀 프로그램 전체: 함수 선언과 그 함수를 쓰는 최상위 let 문이 서로 다른 배열에 모인다.
const factorialSource = `fn factorial(n: number): number {
  if (n <= 1) { return 1; }
  return n * factorial(n - 1);
}
let answer: number = factorial(5);`;
console.log("\n=== 함수 하나와 최상위 문 하나인 팩토리얼 프로그램 ===");
console.log(factorialSource);
const factorialProgram = parseWholeProgram(factorialSource);

// 알려진 예제의 두 번째 return 문에서 call을 꺼내, callee 문자열과 선언 이름을 직접
// 비교한다. 같다는 사실은 스코프 해석 결과가 아니라 파서가 보존한 두 철자의 비교다.
const factorialDeclaration = factorialProgram?.functions[0];
const recursiveReturn = factorialDeclaration?.body.statements[1];
const recursiveCall = recursiveReturn?.kind === "return"
  && recursiveReturn.value.kind === "binary"
  && recursiveReturn.value.right.kind === "call"
  ? recursiveReturn.value.right
  : undefined;

if (factorialDeclaration !== undefined && recursiveCall !== undefined) {
  console.log(`본문 재귀 호출: ${describeExpr(recursiveCall)}`);
  console.log(`callee가 자기 함수 이름과 같은가: ${recursiveCall.callee === factorialDeclaration.name}`);
}

// 다른 함수 호출과 재귀 호출의 차이는 callee와 args의 값뿐이다. 두 노드 모두
// kind/callee/args 세 필드로 만들어져 파서에는 "재귀"를 나타내는 별도 갈래가 없다.
console.log("\n=== 다른 함수 호출과 재귀 호출의 AST 모양 비교 ===");
if (addCall?.kind === "call" && recursiveCall !== undefined) {
  const otherFields = Object.keys(addCall).join(", ");
  const recursiveFields = Object.keys(recursiveCall).join(", ");
  console.log(`다른 함수 호출: ${describeExpr(addCall)} / 필드: ${otherFields}`);
  console.log(`재귀 함수 호출: ${describeExpr(recursiveCall)} / 필드: ${recursiveFields}`);
  console.log(`필드 모양이 같은가: ${otherFields === recursiveFields}`);
}

// 실패도 값: 닫는 괄호가 없으면 eof의 위치에서 필요한 구두점을 정확히 진단한다.
const missingCloseSource = "add(1, 2";
console.log(`\n=== 닫는 괄호 누락: ${missingCloseSource} ===`);
parseExpression(missingCloseSource);

// 콤마 뒤에는 반드시 다음 Expr이 와야 하므로, 닫는 괄호 위치가 식 오류로 남는다.
const missingArgSource = "add(1, )";
console.log(`\n=== 콤마 뒤 인자 누락: ${missingArgSource} ===`);
parseExpression(missingArgSource);

// 마지막에는 요약 문자열이 숨긴 실제 재귀 호출 노드를 JSON으로 한 번 확인한다.
if (recursiveCall !== undefined) {
  console.log("\n=== 실제 재귀 호출 노드 값 ===");
  console.log(JSON.stringify(recursiveCall, null, 2));
}
