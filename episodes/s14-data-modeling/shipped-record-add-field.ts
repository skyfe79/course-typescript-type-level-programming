// 선택적 필드를 추가할 때 값을 읽는 함수와 키 전체를 다루는 내보내기가 어떻게 달라지는지 보여줍니다.
// keyof에 묶인 CSV 레이블 표가 새 열에 대한 결정을 컴파일 시점에 요구합니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s14-data-modeling/shipped-record-add-field.ts

// codeStep 212 — 기존 레코드, 값을 읽는 컨슈머 세 개, 키에 묶인 CSV 내보내기

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

const columnLabels: Record<keyof ParsedOrder, string> = {
  orderId: "주문 번호",
  quantity: "수량",
  unitPriceCents: "단가",
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

export {};
