// 토큰화 결과의 판별 유니온 필드와 각 토큰의 시작 위치를 관찰한다.

import { tokenize } from "./src/lexer.ts";
import type { Token } from "./src/tokens.ts";

// TokenValue와 SourcePosition의 인터섹션이어도 kind로 나눈 각 분기에서는 고유
// 필드가 그대로 좁혀진다. 아래 모든 접근은 타입 단언 없이 컴파일된다.
function describeToken(token: Token): string {
  const position = `${token.line}:${token.offset}`;

  switch (token.kind) {
    case "number":
      return `${position} number ${token.value}`;
    case "string":
      return `${position} string ${JSON.stringify(token.value)}`;
    case "identifier":
      return `${position} identifier ${token.name}`;
    case "keyword":
      return `${position} keyword ${token.word}`;
    case "operator":
      return `${position} operator ${token.op}`;
    case "punct":
      return `${position} punct ${token.char}`;
    case "eof":
      return `${position} eof`;
  }
}

// 가장 짧은 예제로 예약어, 식별자, 대입, 숫자, 산술 연산자가 차례로 토큰이
// 되는 모습을 본다. JSON 출력에는 각 토큰이 시작된 offset과 line도 함께 보인다.
const shortSource = "let x = 1 + 2";
const shortResult = tokenize(shortSource);

console.log(`=== 짧은 프로그램 토큰화: ${shortSource} ===`);
console.log(JSON.stringify(shortResult.tokens, null, 2));
console.log("진단:", JSON.stringify(shortResult.diagnostics));

// 더 긴 예제에는 문자열과 구두점뿐 아니라 <=, &&, != 두 글자 연산자와 if,
// return, true 예약어가 모두 들어 있다. 긴 연산자를 먼저 읽는지도 함께 관찰한다.
const longSource = 'let name = "tiny"; if (x <= 2 && y != 3) { return true; }';
const longResult = tokenize(longSource);

console.log(`\n=== 여러 토큰 종류가 섞인 프로그램: ${longSource} ===`);
console.log(JSON.stringify(longResult.tokens, null, 2));
console.log("진단:", JSON.stringify(longResult.diagnostics));

// 공백으로 지나가는 개행과 문자열 내용 속 개행을 모두 넣는다. 세 번째 줄의 return
// 토큰이 line 3을 가지면 두 경로에서 줄 번호가 빠짐없이 증가했다는 뜻이다.
const multilineSource = `let message = "첫 줄
둘째 줄";
return message;`;
const multilineResult = tokenize(multilineSource);

console.log("\n=== 여러 줄 프로그램을 사람이 읽는 한 줄씩 표시 ===");
for (const token of multilineResult.tokens) {
  console.log(describeToken(token));
}
console.log("진단:", JSON.stringify(multilineResult.diagnostics));

// eof는 실제 소스의 마지막 문자 뒤 오프셋과 마지막 줄을 갖는다.
console.log("\n마지막 토큰:", JSON.stringify(longResult.tokens[longResult.tokens.length - 1]));
