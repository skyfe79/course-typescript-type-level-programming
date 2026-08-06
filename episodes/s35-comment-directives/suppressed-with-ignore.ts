// 버그를 고친 뒤에도 남은 @ts-ignore가 검사 결과와 런타임에 미치는 영향을 확인합니다.
// 검사: npx tsc --noEmit --ignoreConfig --strict episodes/s35-comment-directives/suppressed-with-ignore.ts
// 실행: node episodes/s35-comment-directives/suppressed-with-ignore.ts

function totalCents(items: { price: number }[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// 올바른 price 필드명을 사용하도록 버그를 고쳤습니다.
const cart = [{ price: 500 }, { price: 1200 }];

// 억제 주석은 손대지 않고 그대로 두었습니다. 이유로 적어 둔 문구는 이미 사실과 어긋나지만,
// 검사는 여전히 0 오류라 아무도 이 줄이 쓸모없어졌다고 알려 주지 않습니다.
// @ts-ignore TS2345: 카트 아이템 필드명이 아직 안 맞는다 — TICKET-501
console.log(totalCents(cart));

// 다른 실습 파일과 전역 이름이 충돌하지 않도록 이 파일을 모듈로 만듭니다.
export {};
