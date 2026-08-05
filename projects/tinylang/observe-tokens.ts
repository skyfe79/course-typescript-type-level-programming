import type { Token } from "./src/tokens.ts";

// 각 객체에 Token을 직접 적어 두면 일곱 변형의 실제 모양을 관찰하는 동시에,
// 필드 이름이나 리터럴 값이 계약과 어긋날 때 타입 검사기가 바로 알려 준다.
const numberToken: Token = { kind: "number", value: 42 };
const stringToken: Token = { kind: "string", value: "hello" };
const identifierToken: Token = { kind: "identifier", name: "answer" };
const keywordToken: Token = { kind: "keyword", word: "let" };
const operatorToken: Token = { kind: "operator", op: "+" };
const punctToken: Token = { kind: "punct", char: ":" };
const eofToken: Token = { kind: "eof" };

const tokens: readonly Token[] = [
  numberToken,
  stringToken,
  identifierToken,
  keywordToken,
  operatorToken,
  punctToken,
  eofToken,
];

console.log("=== Token 판별 유니온의 일곱 가지 모양 ===");
console.log(JSON.stringify(tokens, null, 2));
