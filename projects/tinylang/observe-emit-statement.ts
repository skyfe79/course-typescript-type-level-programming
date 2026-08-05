// 실제 tinylang 소스에서 얻은 문과 함수 선언이 읽기 좋은 자바스크립트로 바뀌는 과정을 관찰한다.

import type { Program } from "./src/ast.ts";
import type { Diagnostic } from "./src/diagnostics.ts";
import { emitFunction, emitStatement } from "./src/emitter.ts";
import { tokenize } from "./src/lexer.ts";
import { createParser } from "./src/parser.ts";

function describeDiagnostic(diagnostic: Diagnostic): string {
  return `${diagnostic.severity}: ${diagnostic.message}`;
}

function parseSource(source: string): Program | undefined {
  const lexed = tokenize(source);
  if (lexed.diagnostics.length > 0) {
    console.log(`렉싱 실패: ${lexed.diagnostics.map(describeDiagnostic).join(", ")}`);
    return undefined;
  }

  const parsed = createParser(lexed.tokens).parseProgram();
  if (!parsed.ok) {
    console.log(`파싱 실패: ${describeDiagnostic(parsed.diagnostic)}`);
    return undefined;
  }

  return parsed.value;
}

function observeStatements(title: string, source: string): void {
  console.log(`\n=== ${title} ===`);
  const program = parseSource(source);
  if (program === undefined) return;

  // 손으로 만든 AST가 아니라 파서가 Program.statements에 모은 문을 그대로 사용한다.
  console.log(program.statements.map((statement) => emitStatement(statement)).join("\n"));
}

function observeFunctions(title: string, source: string): void {
  console.log(`\n=== ${title} ===`);
  const program = parseSource(source);
  if (program === undefined) return;

  // 함수 역시 소스 위치를 다시 찾거나 객체를 단언하지 않고 Program.functions에서 얻는다.
  console.log(program.functions.map((func) => emitFunction(func)).join("\n"));
}

observeStatements(
  "if / else if / else와 중첩 블록",
  `
if (score > 90) {
  {
    print("A");
  }
} else if (score > 80) {
  print("B");
} else {
  print("C");
}
`,
);

observeStatements(
  "조건과 대입이 있는 while",
  `
while (count < 3) {
  count = count + 1;
}
`,
);

observeFunctions(
  "맹글링된 이름으로 재귀 호출하는 함수",
  `
fn factorial(n: number): number {
  if (n <= 1) {
    return 1;
  } else {
    return n * factorial(n - 1);
  }
}
`,
);

observeFunctions(
  "함수 안의 프렐류드 호출",
  `
fn announce(message: string): string {
  print(message);
  return message;
}
`,
);
