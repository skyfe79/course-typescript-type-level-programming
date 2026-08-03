import type { OrderEvent } from "./order-event.ts";

function makeLogPrefix(orderId: string): string {
  return `[감사 로그] 주문 ${orderId}`;
}

function writeAuditLog(event: OrderEvent): string {
  const prefix = makeLogPrefix(event.orderId);

  switch (event.kind) {
    case "created":
      return `${prefix}: 생성`;
    case "paid":
      return `${prefix}: 결제 (${event.amount}원)`;
    case "shipped":
      return `${prefix}: 배송 (${event.trackingId})`;
    case "cancelled":
      return `${prefix}: 취소 사유 기록 - ${event.reason}`;
    default: {
      const exhaustiveCheck: never = event;
      throw new Error(`감사 로그에 기록할 수 없는 이벤트: ${exhaustiveCheck}`);
    }
  }
}

console.log(writeAuditLog({ kind: "created", orderId: "ORD-001" }));
console.log(writeAuditLog({ kind: "paid", orderId: "ORD-002", amount: 32000 }));
console.log(writeAuditLog({ kind: "cancelled", orderId: "ORD-003", reason: "배송지 오류" }));
