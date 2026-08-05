// 파일을 읽지 않고 소스 문자열만 바꿔 넣어, 컴파일 파이프라인의 각 중단 지점을 관찰한다.

import { compile, formatDiagnostic } from "./src/compile.ts";

function observe(title: string, source: string): void {
  console.log(`\n=== ${title} ===`);
  const result = compile(source);

  if (result.ok) {
    console.log("성공 여부: true");
    console.log(`함수 개수: ${result.program.functions.length}개`);
    console.log(`문 개수: ${result.program.statements.length}개`);
    return;
  }

  console.log("성공 여부: false");
  for (const diagnostic of result.diagnostics) {
    console.log(formatDiagnostic(diagnostic));
  }
}

observe(
  "정상 소스",
  `
fn double(n: number): number {
  return n * 2;
}
let value: number = double(21);
`,
);

observe("렉싱 실패", "let value: number = @;");
observe("파싱 실패", 'print("안녕";');
observe("검사 실패", 'let count: number = "다섯";');
observe("내장 함수 호출", 'print("안녕");');
observe("값 없는 호출을 값으로 사용", "let x: number = print(1);");
