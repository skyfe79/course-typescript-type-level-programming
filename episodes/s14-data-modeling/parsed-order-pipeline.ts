// RawInput을 ParsedOrder로 한 번 파싱하면 이후 함수들이 검증된 타입만 받는 흐름을 보여줍니다.
// 파싱 경계 뒤에서는 재검증 없이 도메인 모델을 안전하게 전달합니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s14-data-modeling/parsed-order-pipeline.ts

// codeStep 208 — RawInput을 ParsedOrder로 파싱하는 경계

type RawInput = unknown;

type ParsedOrder = {
  orderId: string;
  quantity: number;
  unitPriceCents: number;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function parseOrder(raw: RawInput): Result<ParsedOrder> {
  if (
    typeof raw === "object" &&
    raw !== null &&
    "orderId" in raw &&
    "quantity" in raw &&
    "unitPriceCents" in raw
  ) {
    const candidate = raw as Record<string, unknown>;
    if (
      typeof candidate.orderId === "string" &&
      typeof candidate.quantity === "number" &&
      candidate.quantity > 0 &&
      typeof candidate.unitPriceCents === "number" &&
      candidate.unitPriceCents >= 0
    ) {
      return {
        ok: true,
        value: {
          orderId: candidate.orderId,
          quantity: candidate.quantity,
          unitPriceCents: candidate.unitPriceCents,
        },
      };
    }
  }
  return { ok: false, error: "invalid order payload" };
}

// codeStep 209 — ParsedOrder만 받는 다운스트림 함수 세 개

function calculateTotalCents(order: ParsedOrder): number {
  return order.quantity * order.unitPriceCents;
}

function applyDiscount(order: ParsedOrder, percentOff: number): number {
  return calculateTotalCents(order) * (1 - percentOff / 100);
}

function formatReceiptLine(order: ParsedOrder): string {
  return `${order.orderId} x${order.quantity} = ${calculateTotalCents(order)}c`;
}

// codeStep 210 — 재검증이 한 번도 없다는 것을 확인

const rawPayload: RawInput = { orderId: "o-1", quantity: 3, unitPriceCents: 1200 };

// @ts-expect-error - RawInput은 ParsedOrder가 아니라 파싱 없이는 넘길 수 없다
calculateTotalCents(rawPayload);

const parsed = parseOrder(rawPayload);
if (parsed.ok) {
  console.log(formatReceiptLine(parsed.value));
  console.log(applyDiscount(parsed.value, 10));
}

export {};
