import { classify } from "./src/lexer.ts";

// 문자 하나가 어느 갈래로 분류되는지 표처럼 나란히 출력한다. 문자열 끝에서
// source[pos]로 얻게 되는 undefined도 별도 범위 검사 없이 eof가 되는지 함께 본다.
const samples: readonly (string | undefined)[] = ["3", "x", "_", " ", '"', "+", "(", undefined];

function displayChar(ch: string | undefined): string {
  return ch === undefined ? "undefined" : JSON.stringify(ch);
}

console.log("=== 렉서의 문자 분류표 ===");
console.log("입력        분류");
console.log("-------------------");
for (const sample of samples) {
  console.log(`${displayChar(sample).padEnd(10)}  ${classify(sample)}`);
}
