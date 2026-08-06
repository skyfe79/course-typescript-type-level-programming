// 실제 TS2345 오류를 @ts-ignore로 억제했을 때의 검사 결과와 런타임 결과를 확인합니다.
// 검사: npx tsc --noEmit --ignoreConfig --strict episodes/s35-comment-directives/suppressed-with-ignore.ts
// 실행: node episodes/s35-comment-directives/suppressed-with-ignore.ts

function totalCents(items: { price: number }[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// 실수로 price가 아니라 cost란 이름을 붙인 배열입니다.
const cart = [{ cost: 500 }, { cost: 1200 }];

// 억제는 컴파일러의 입을 막을 뿐 버그를 고치지 않으므로, 이 호출은 런타임에 NaN을 출력합니다.
// @ts-ignore TS2345: 카트 아이템 필드명이 아직 안 맞는다 — TICKET-501
console.log(totalCents(cart));

// 다른 실습 파일과 전역 이름이 충돌하지 않도록 이 파일을 모듈로 만듭니다.
export {};
