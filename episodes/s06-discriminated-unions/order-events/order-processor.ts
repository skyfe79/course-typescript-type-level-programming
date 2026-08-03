import type { OrderEvent } from "./order-event.ts";

function formatAmount(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

function processPayment(event: OrderEvent): string {
  switch (event.kind) {
    case "created":
      return `주문 ${event.orderId}: 결제 대기`;
    case "paid":
      return `주문 ${event.orderId}: ${formatAmount(event.amount)} 결제 완료`;
    case "shipped":
      return `주문 ${event.orderId}: 배송이 시작되어 결제 처리 완료`;
    case "cancelled":
      return `주문 ${event.orderId}: 취소되어 결제 처리에서 제외 (${event.reason})`;
    default: {
      const exhaustiveCheck: never = event;
      throw new Error(`처리하지 않은 주문 이벤트: ${exhaustiveCheck}`);
    }
  }
}

console.log(processPayment({ kind: "created", orderId: "ORD-001" }));
console.log(processPayment({ kind: "paid", orderId: "ORD-002", amount: 32000 }));
console.log(processPayment({ kind: "cancelled", orderId: "ORD-003", reason: "고객 변심" }));
