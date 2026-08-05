// 파이프로 미리 보낸 입력과 터미널에서 직접 친 입력이 같은 input 경로를 지나 한 줄로 읽힌다.

import { input } from "./src/prelude.ts";

console.log("\n=== 프롬프트를 준 input ===");
const withPrompt = input("입력> ");
// JSON 문자열 표기의 따옴표 안에 값을 놓아 앞뒤 공백이 보존되었는지 눈으로 확인한다.
console.log(`읽은 값: ${JSON.stringify(withPrompt)}`);

console.log("\n=== 프롬프트가 없는 input ===");
const withoutPrompt = input();
console.log(`읽은 값: ${JSON.stringify(withoutPrompt)}`);
