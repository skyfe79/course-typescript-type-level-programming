// tinylang 프로그램이 기본으로 사용하는 동기 런타임 함수의 정상 결과와 실패 모습을 관찰한다.

import { print, random, toNumber } from "./src/prelude.ts";

function describeError(error: unknown): string {
  // Error 객체에서는 message만 꺼내 임시 경로나 줄 번호가 든 스택을 출력하지 않는다.
  // 혹시 Error가 아닌 값이 던져져도 관찰 스크립트 자체가 멈추지 않도록 문자열로 바꾼다.
  return error instanceof Error ? error.message : String(error);
}

console.log("\n=== print: 세 런타임 값 ===");
// 별도 포맷터를 거치지 않으므로 number, string, boolean이 console.log에 그대로 전달된다.
print(7);
print("안녕하세요");
print(true);

console.log("\n=== toNumber: 변환 성공 ===");
console.log(`"7" -> ${toNumber("7")}`);
console.log(`" 42 " -> ${toNumber(" 42 ")}`);

console.log("\n=== toNumber: 변환 실패 ===");
for (const text of ["abc", ""]) {
  try {
    toNumber(text);
  } catch (error) {
    // 실패 값마다 메시지만 남겨 실행 환경에 따라 달라지는 스택이 강의 화면에 섞이지 않게 한다.
    console.log(describeError(error));
  }
}

console.log("\n=== random: 범위와 관찰된 값 ===");
const observed = new Set<number>();
let allResultsAreValid = true;

// 무작위 값 하나는 실행할 때마다 달라진다. 여러 번 뽑은 뒤 함수가 약속한 범위를 계속
// 지켰는지와 실제로 등장한 값의 집합만 보여 주면 매 실행에서 확인할 핵심이 분명해진다.
for (let count = 0; count < 1_000; count += 1) {
  const value = random(6);
  observed.add(value);
  if (!Number.isInteger(value) || value < 0 || value >= 6) {
    allResultsAreValid = false;
  }
}

const sortedObserved = [...observed].sort((left, right) => left - right);
console.log(`모든 결과가 0 이상 6 미만의 정수: ${allResultsAreValid}`);
console.log(`관찰된 값의 집합: ${sortedObserved.join(", ")}`);

console.log("\n=== random: 잘못된 최댓값 ===");
for (const max of [0, -1]) {
  try {
    random(max);
  } catch (error) {
    // 유효하지 않은 상한도 오류 메시지만 출력해 실패 이유를 안정적인 한 줄로 관찰한다.
    console.log(describeError(error));
  }
}
