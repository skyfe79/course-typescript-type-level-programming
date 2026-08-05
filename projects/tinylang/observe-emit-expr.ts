// 실제 tinylang 소스에서 얻은 식 AST를 자바스크립트 텍스트로 바꾸는 과정을 관찰한다.

import type { Expr } from "./src/ast.ts";
import type { Diagnostic } from "./src/diagnostics.ts";
import { emitExpr } from "./src/emitter.ts";
import { tokenize } from "./src/lexer.ts";
import { createParser } from "./src/parser.ts";

function describeDiagnostic(diagnostic: Diagnostic): string {
  return `${diagnostic.severity}: ${diagnostic.message}`;
}

// 관찰할 식을 변수 선언의 초기화식 자리에 넣어 완전한 프로그램으로 만든다. 손으로
// AST 객체를 적지 않으므로 렉서와 파서가 정한 우선순위와 호출 구조가 그대로 입력된다.
// 선언 타입은 파싱에만 필요하며 이 스크립트는 타입 검사를 하지 않으므로 항상 number를 쓴다.
function parseExpression(source: string): Expr | undefined {
  const programSource = `let result: number = ${source};`;
  const lexed = tokenize(programSource);
  if (lexed.diagnostics.length > 0) {
    console.log(`${source} → 렉싱 실패: ${lexed.diagnostics.map(describeDiagnostic).join(", ")}`);
    return undefined;
  }

  const parsed = createParser(lexed.tokens).parseProgram();
  if (!parsed.ok) {
    console.log(`${source} → 파싱 실패: ${describeDiagnostic(parsed.diagnostic)}`);
    return undefined;
  }

  // 위에서 만든 프로그램에는 varDecl 하나만 있어야 한다. 그래도 배열 인덱스와 kind를
  // 확인해, 관찰용 래퍼나 파서가 바뀌었을 때 잘못된 노드를 단언으로 숨기지 않는다.
  const statement = parsed.value.statements[0];
  if (statement === undefined || statement.kind !== "varDecl") {
    console.log(`${source} → 초기화식을 찾지 못했습니다`);
    return undefined;
  }

  return statement.initializer;
}

function observe(title: string, source: string): void {
  console.log(`\n=== ${title} ===`);
  const expression = parseExpression(source);
  if (expression === undefined) return;

  console.log(`${source} → ${emitExpr(expression)}`);
}

observe("연산자 우선순위 보존", "x + 1 * y");
observe("프렐류드 함수 호출", "print(x)");
observe("사용자 정의 함수 호출", "add(x, 1)");
observe("문자열 리터럴", '"안녕"');
observe("불리언 리터럴", "true");
