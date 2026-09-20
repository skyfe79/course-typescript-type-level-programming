// 선택적 필드를 추가할 때 값을 읽는 함수와 키 전체를 다루는 내보내기가 어떻게 달라지는지 보여줍니다.
// keyof에 묶인 CSV 레이블 표가 새 열에 대한 결정을 컴파일 시점에 요구합니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s14-data-modeling/shipped-record-add-field.ts

// codeStep 212 — 기존 레코드, 값을 읽는 컨슈머 세 개, 키에 묶인 CSV 내보내기

type ParsedOrder = {
  orderId: string;
  quantity: number;
  unitPriceCents: number;
  // codeStep 213 — 선택적 필드 추가와 내보내기 열 결정
  // 값이 선택적이어도 keyof에는 giftMessage 키가 포함된다.
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

const columnLabels: Record<keyof ParsedOrder, string> = {
  orderId: "주문 번호",
  quantity: "수량",
  unitPriceCents: "단가",
  // 이 줄이 없으면 columnLabels에서 giftMessage가 빠졌다는 TS2741 오류가 정확히 하나 발생한다.
  // 세 함수는 그대로 통과하며, 이 레이블이 컴파일러가 요구한 새 열에 대한 결정이다.
  giftMessage: "선물 메시지",
};

const columns = Object.keys(columnLabels) as (keyof ParsedOrder)[];

function csvHeader(): string {
  return columns.map((key) => columnLabels[key]).join(",");
}

function csvRow(order: ParsedOrder): string {
  return columns.map((key) => String(order[key] ?? "")).join(",");
}

const legacy: ParsedOrder = { orderId: "o-41", quantity: 1, unitPriceCents: 500 };

console.log(csvHeader());
console.log(csvRow(legacy));

// codeStep 214 — 새 필드를 채운 주문 내보내기

const shipped: ParsedOrder = {
  orderId: "o-42",
  quantity: 2,
  unitPriceCents: 900,
  giftMessage: "생일 축하해요",
};

console.log(formatReceiptLine(shipped));
console.log(csvRow(shipped));

export {};
