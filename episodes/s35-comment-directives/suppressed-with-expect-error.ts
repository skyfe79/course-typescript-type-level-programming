// 버그를 고친 뒤 쓸모없어진 @ts-expect-error가 TS2578을 내는지 확인합니다.
// 검사: npx tsc --noEmit --ignoreConfig --strict episodes/s35-comment-directives/suppressed-with-expect-error.ts
// 실행: node episodes/s35-comment-directives/suppressed-with-expect-error.ts
// TS2578을 보여 주려고 일부러 실패하는 파일이라 저장소 전체 검사에서는 빠져 있습니다.
// node는 타입을 걷어 내고 실행하므로 1700이 찍힙니다. 깨지는 것은 프로그램이 아니라 빌드 게이트입니다.

function totalCents(items: { price: number }[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// 올바른 price 필드명을 사용하도록 버그를 고쳤습니다.
const cart = [{ price: 500 }, { price: 1200 }];

// 억제 주석은 앞 파일과 똑같이 손대지 않고 그대로 두었습니다. 버그가 사라져 억제할 오류가
// 없으므로, 쓸모없어진 지시어 자체가 TS2578로 실패해 이 줄이 이제 필요 없다고 알려 줍니다.
// @ts-expect-error TS2345: 카트 아이템 필드명이 아직 안 맞는다 — TICKET-501
console.log(totalCents(cart));

// 다른 실습 파일과 전역 이름이 충돌하지 않도록 이 파일을 모듈로 만듭니다.
export {};
