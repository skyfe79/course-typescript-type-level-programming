// 생성한 tinylang 자바스크립트가 별도 실행 준비 없이 평범한 `node program.js`로 동작하는지 관찰한다.

import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

const program = parseSource(`
fn double(n: number): number {
  return n * 2;
}

let name: string = input("이름: ");
print("안녕하세요, " + name);
let value: number = toNumber(input("숫자: "));
print(double(value));
`);

if (program !== undefined) {
  const emitted = emitProgram(program);
  const temporaryDirectory = mkdtempSync(`${tmpdir()}/tinylang-run-emitted-`);
  const generatedFile = join(temporaryDirectory, "program.js");
  const copiedPreludeTypeScript = join(temporaryDirectory, "prelude.ts");
  const copiedPreludeJavaScript = join(temporaryDirectory, "prelude.js");

  try {
    writeFileSync(generatedFile, emitted, "utf8");

    // program.js는 이름이 고정된 prelude.js를 가져오고, 그 다리는 실제 구현인 prelude.ts를
    // 다시 내보낸다. Node가 두 상대 경로를 모두 찾도록 생성 파일 옆에 두 파일을 함께 둔다.
    copyFileSync(join(import.meta.dirname, "src", "prelude.ts"), copiedPreludeTypeScript);
    copyFileSync(join(import.meta.dirname, "src", "prelude.js"), copiedPreludeJavaScript);

    const execution = spawnSync(process.execPath, [generatedFile], {
      encoding: "utf8",
      input: "가온\n21\n",
    });

    console.log("\n=== 생성된 tinylang 프로그램 실행 ===");
    console.log(`종료 코드: ${execution.status ?? "없음"}`);
    console.log("표준 출력:");
    // 임시 경로나 스택을 섞지 않고 프로그램의 stdout만 그대로 보여 주어 매번 같은 결과를 남긴다.
    process.stdout.write(execution.stdout);
  } finally {
    // 관찰을 위해 복사하고 생성한 파일은 실행 직후 고유 임시 디렉터리와 함께 정리한다.
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}
