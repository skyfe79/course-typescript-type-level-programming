// 실제 tinylang 프로그램을 렉싱·파싱한 뒤 문과 함수 타입 검사의 진단을 관찰한다.

import type { Program } from "./src/ast.ts";
import { checkProgram } from "./src/checker.ts";
import type { Diagnostic } from "./src/diagnostics.ts";
import { tokenize } from "./src/lexer.ts";
import { createParser } from "./src/parser.ts";

function describeDiagnostic(diagnostic: Diagnostic): string {
  const severity = diagnostic.severity === "error" ? "오류" : "경고";
  return `${severity}: ${diagnostic.message}`;
}

function parseProgram(source: string): Program | undefined {
  const lexed = tokenize(source);
  if (lexed.diagnostics.length > 0) {
    console.log("렉싱 실패");
    lexed.diagnostics.forEach((diagnostic, index) => {
      console.log(`${index + 1}. ${describeDiagnostic(diagnostic)}`);
    });
    return undefined;
  }

  const parsed = createParser(lexed.tokens).parseProgram();
  if (!parsed.ok) {
    console.log(`파싱 실패: ${describeDiagnostic(parsed.diagnostic)}`);
    return undefined;
  }

  return parsed.value;
}

function observe(title: string, source: string, showCount = false): void {
  console.log(`\n=== ${title} ===`);
  const program = parseProgram(source);
  if (program === undefined) return;

  const diagnostics = checkProgram(program);
  if (diagnostics.length === 0) {
    console.log("진단 없음");
  } else {
    diagnostics.forEach((diagnostic, index) => {
      console.log(`${index + 1}. ${describeDiagnostic(diagnostic)}`);
    });
  }

  if (showCount) {
    console.log(`진단 개수: ${diagnostics.length}개`);
  }
}

observe(
  "1. 통과하는 프로그램",
  `
let global: number = 1;
fn add(a: number, b: number): number {
  return a + b;
}
let sum: number = add(global, 2);
if (sum > 0) {
  sum = sum + 1;
} else {
  sum = 0;
}
while (sum < 5) {
  sum = sum + 1;
}
`,
);

observe(
  "2. 대입 타입 불일치",
  `
let x: number = 1;
x = "hi";
`,
);

observe(
  "3. 선언 타입과 초기값 불일치",
  `
let flag: boolean = 1;
`,
);

observe(
  "4. 조건이 boolean이 아님",
  `
if (1) {}
while ("hi") {}
`,
);

observe(
  "5. 인자 개수 불일치",
  `
fn add(a: number, b: number): number {
  return a + b;
}
add(1);
`,
);

observe(
  "6. 반환 타입 불일치",
  `
fn wrong(): number {
  return "hi";
}
`,
);

observe(
  "7. 블록 스코프와 섀도잉",
  `
let x: number = 1;
{
  let x: string = "안쪽";
  let hidden: boolean = true;
}
hidden;
`,
);

observe(
  "8. 매개변수와 전역 변수의 가시성",
  `
let global: number = 10;
fn addGlobal(value: number): number {
  return value + global;
}
addGlobal(1);
`,
);

observe(
  "9. 연쇄 오류 억제",
  `
missing + 1;
`,
  true,
);
