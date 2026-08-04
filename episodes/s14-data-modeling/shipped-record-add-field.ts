// 이미 배포된 레코드 타입에 부가 필드를 추가하는 방법을 보여줍니다.
// 기존 컨슈머 세 개는 그대로 두고 선택적 필드만 확장합니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s14-data-modeling/shipped-record-add-field.ts

// codeStep 212 — 기존 레코드와 컨슈머 세 개 준비

type ParsedOrder = {
  orderId: string;
  quantity: number;
  unitPriceCents: number;
  // codeStep 213 — 필드 추가 방식 선택하고 적용
  // giftMessage는 있어도 없어도 기존 로직에 영향을 주지 않는 부가 정보라
  // 버전 있는 레코드가 아니라 선택적 필드로 추가합니다.
  giftMessage?: string;
};

function calculateTotalCents(order: ParsedOrder): number {
  return order.quantity * order.unitPriceCents;
}

function applyDiscount(order: ParsedOrder, percentOff: number): number {
  return calculateTotalCents(order) * (1 - percentOff / 100);
}

function formatReceiptLine(order: ParsedOrder): string {
  return `${order.orderId} x${order.quantity} = ${calculateTotalCents(order)}c`;
}

// codeStep 214 — 세 컨슈머가 그대로 컴파일되는지 확인

function formatGiftNote(order: ParsedOrder): string {
  return order.giftMessage ?? "(no gift message)";
}

const shipped: ParsedOrder = {
  orderId: "o-42",
  quantity: 2,
  unitPriceCents: 900,
  giftMessage: "생일 축하해요",
};

console.log(formatReceiptLine(shipped));
console.log(formatGiftNote(shipped));

export {};
