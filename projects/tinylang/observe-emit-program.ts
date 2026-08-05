// 실제 tinylang 프로그램 전체를 파싱하고, 실행 가능한 자바스크립트 파일로 조립하는 과정을 관찰한다.

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import type { Program } from "./src/ast.ts";
import type { Diagnostic } from "./src/diagnostics.ts";
import { emitProgram } from "./src/emitter.ts";
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

const completeProgram = parseSource(`
let value: number = 21;

fn double(n: number): number {
  return n * 2;
}

print(double(value));
`);

if (completeProgram !== undefined) {
  console.log("\n=== 함수와 최상위 문을 조립한 자바스크립트 ===");
  const emitted = emitProgram(completeProgram);

  // emitProgram이 보장하는 마지막 줄바꿈까지 그대로 써서, 생성 파일의 전문과
  // 들여쓰기를 console.log가 덧붙이는 추가 줄바꿈 없이 관찰한다.
  process.stdout.write(emitted);

  console.log("\n=== 아직 없는 프렐류드를 불러올 때의 실행 결과 ===");
  const temporaryDirectory = mkdtempSync(`${tmpdir()}/tinylang-emit-program-`);
  const generatedFile = `${temporaryDirectory}/program.js`;

  try {
    writeFileSync(generatedFile, emitted, "utf8");
    const execution = spawnSync(process.execPath, [generatedFile], { encoding: "utf8" });

    // Node의 stderr에는 임시 디렉터리 절대 경로와 스택이 함께 들어간다. 그 전문은
    // 출력하지 않고 안정적인 오류 코드만 찾는다. 모듈 지정자는 생성한 import에서
    // 이미 결정된 상대 경로만 표시하므로 실행할 때마다 같은 한 줄을 얻는다.
    const errorCode = execution.stderr.match(/\bERR_MODULE_NOT_FOUND\b/)?.[0] ?? "알 수 없음";
    console.log(
      `종료 코드: ${execution.status ?? "없음"}, 오류 코드: ${errorCode}, 모듈 지정자: ./prelude.js`,
    );
  } finally {
    // 관찰을 위해 만든 파일과 그 파일만 담은 고유 임시 디렉터리를 실행 직후 정리한다.
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

const statementOnlyProgram = parseSource(`
let answer: number = 42;
print(answer);
`);

if (statementOnlyProgram !== undefined) {
  console.log("\n=== 함수가 없는 프로그램 ===");
  // 함수 구역이 빈 문자열이어도 프렐류드와 첫 문 사이에는 구역 구분용 빈 줄 하나만 남는다.
  process.stdout.write(emitProgram(statementOnlyProgram));
}
