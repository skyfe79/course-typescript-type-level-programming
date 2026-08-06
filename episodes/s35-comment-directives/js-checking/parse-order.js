// @ts-check
// 이 파일은 checkJs가 꺼진 프로젝트에서도 @ts-check로 파일 하나의 타입 검사만 켤 수 있음을 보여 줍니다.
// 검사: npx tsc --noEmit -p episodes/s35-comment-directives/js-checking
// 실행: node episodes/s35-comment-directives/js-checking/parse-order.js
// 검사하면 아래 문자열 인수에서 TS2345가 나와야 하고, 실행하면 런타임 강제 변환으로 1100이 출력됩니다.
// 타입 실수는 런타임 프로그램을 멈추지 않으며, 검사기만 그 실수를 알려 줍니다.

function addTax(amountCents = 0) {
  return Math.round(amountCents * 1.1);
}

console.log(addTax("1000"));   // 실수: 숫자를 기대하는 자리에 문자열을 넘긴다

export {};
