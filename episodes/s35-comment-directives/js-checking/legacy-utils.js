// 이 파일에는 일부러 // @ts-check를 붙이지 않았습니다. checkJs가 꺼져 있어 같은 타입 실수가 있어도
// 파일 단위 검사를 받지 않고 조용히 지나가는 기존 JavaScript 파일을 보여 줍니다.
// 검사: npx tsc --noEmit -p episodes/s35-comment-directives/js-checking
// 실행: node episodes/s35-comment-directives/js-checking/legacy-utils.js
// 검사할 때 이 파일에서는 오류가 없어야 하고, 실행하면 "1000" * 1.1의 결과인 1100이 출력되어야 합니다.
// 타입 실수는 런타임 프로그램을 멈추지 않으며, 검사기만 그 실수를 알려 줍니다.

function addTax(amountCents = 0) {
  return Math.round(amountCents * 1.1);
}

console.log(addTax("1000"));   // 실수: 숫자를 기대하는 자리에 문자열을 넘긴다

export {};
