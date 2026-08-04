// 이미 배포된 레코드 타입에 부가 필드를 추가하는 방법을 보여줍니다.
// 기존 컨슈머 세 개는 그대로 두고 선택적 필드만 확장합니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s14-data-modeling/shipped-record-add-field.ts

// codeStep 212 — 기존 레코드와 컨슈머 세 개 준비

type ParsedOrder = {
  orderId: string;
  quantity: number;
  unitPriceCents: number;
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

export {};
