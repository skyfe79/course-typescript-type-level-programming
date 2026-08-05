// 직접 만든 진단과 렉서가 예외 없이 모아 돌려주는 진단 목록을 관찰한다.

import { makeDiagnostic, toLine, toOffset } from "./src/diagnostics.ts";
import { tokenize } from "./src/lexer.ts";
import type { Diagnostic } from "./src/diagnostics.ts";

const directDiagnostic = makeDiagnostic(
  "error",
  "알 수 없는 문자입니다",
  toOffset(7),
  toLine(1),
);

console.log("=== 직접 만든 Diagnostic ===");
console.log(directDiagnostic);

// TS2345: Line은 세 번째 Offset 매개변수에 할당할 수 없다.
// @ts-expect-error - offset과 line을 바꾼 호출이 실제 타입 오류인지 계속 검사한다.
makeDiagnostic("error", "위치 단위를 바꾼 진단", toLine(1), toOffset(7));

function formatDiagnostic(diagnostic: Diagnostic): string {
  return `${diagnostic.line}:${diagnostic.offset} ${diagnostic.severity}: ${diagnostic.message}`;
}

function observeInvalidSource(label: string, source: string): void {
  // tokenize는 첫 오류에서 throw하지 않는다. 복구할 수 있는 오류는 한 문자씩
  // 건너뛰므로 한 결과에서 여러 진단과 그 뒤의 정상 토큰을 함께 확인할 수 있다.
  const result = tokenize(source);
  console.log(`\n=== ${label} ===`);
  console.log("소스:", JSON.stringify(source));
  console.log("남은 토큰:", result.tokens.map((token) => token.kind).join(", "));
  for (const diagnostic of result.diagnostics) {
    console.log(formatDiagnostic(diagnostic));
  }
}

// @와 #은 알 수 없는 문자, 홀로 쓴 &는 알 수 없는 연산자다. 세 오류 뒤에도 4와
// eof가 토큰으로 남아, 오류를 값으로 모으는 복구의 이점을 보여 준다.
observeInvalidSource("여러 오류를 한 번에 수집", "let x = 1 @ 2 & 3 # 4");

// 닫는 따옴표가 없으면 다시 렉싱을 시작할 안전한 경계가 없어 입력 끝에서 멈춘다.
// 그래도 예외 대신 지금까지의 토큰과 진단 하나가 정상적인 반환값으로 나온다.
observeInvalidSource("닫는 따옴표가 없는 문자열", 'let message = "끝나지 않음');
