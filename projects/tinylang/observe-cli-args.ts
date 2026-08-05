// CLI 진입점 모듈을 import해도 main은 실행되지 않고, 순수한 인자 판정 함수만 관찰할 수 있다.

import { parseArgs } from "./src/cli.ts";

const examples: readonly (readonly string[])[] = [
  ["check", "examples/greet.tl"],
  ["build", "examples/greet.tl"],
  ["build", "examples/greet.tl", "-o", "build/greet.js"],
  ["run", "examples/greet.tl"],
  [],
  ["compile", "examples/greet.tl"],
  ["check"],
  ["check", "examples/greet.tl", "-o", "x.js"],
  ["build", "examples/greet.tl", "-o"],
  ["build", "a.tl", "-o", "x.js", "-o", "y.js"],
  ["run", "a.tl", "extra"],
];

for (const argv of examples) {
  // JSON 표기는 입력 배열과 판별 유니온의 필드를 한 줄에서 안정적으로 비교하게 해 준다.
  console.log(`${JSON.stringify(argv)} => ${JSON.stringify(parseArgs(argv))}`);
}
