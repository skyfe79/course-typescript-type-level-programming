import { tokenize } from "./src/lexer.ts";

// 가장 짧은 예제로 예약어, 식별자, 대입, 숫자, 산술 연산자가 차례로 토큰이
// 되는 모습을 본다. JSON 들여쓰기를 사용해 각 판별 유니온의 필드도 눈에 띄게 한다.
const shortSource = "let x = 1 + 2";
const shortTokens = tokenize(shortSource);

console.log(`=== 짧은 프로그램 토큰화: ${shortSource} ===`);
console.log(JSON.stringify(shortTokens, null, 2));

// 더 긴 예제에는 문자열과 구두점뿐 아니라 <=, &&, != 두 글자 연산자와 if,
// return, true 예약어가 모두 들어 있다. 긴 연산자를 먼저 읽는지도 함께 관찰한다.
const longSource = 'let name = "tiny"; if (x <= 2 && y != 3) { return true; }';
const longTokens = tokenize(longSource);

console.log(`\n=== 여러 토큰 종류가 섞인 프로그램: ${longSource} ===`);
console.log(JSON.stringify(longTokens, null, 2));

// tokenize가 반환하는 배열은 실제 소스의 마지막 문자 뒤에도 eof를 하나 붙인다.
// 배열 접근 결과를 그대로 출력해 마지막 원소의 모양을 눈으로 확인한다.
console.log("\n마지막 토큰:", JSON.stringify(longTokens[longTokens.length - 1]));
