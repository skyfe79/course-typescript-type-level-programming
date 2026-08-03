import type { OrderEvent } from "./order-event.ts";

function routeNotification(event: OrderEvent): string {
  switch (event.kind) {
    case "created":
      return `${event.orderId} 주문 접수 메일 발송`;
    case "paid":
      return `${event.orderId} 결제 완료 메일 발송`;
    case "shipped":
      return `${event.orderId} 배송 안내 메일 발송 (${event.trackingId})`;
    default: {
      const exhaustiveCheck: never = event;
      throw new Error(`알림 경로가 없는 주문 이벤트: ${exhaustiveCheck}`);
    }
  }
}

console.log(routeNotification({ kind: "created", orderId: "ORD-001" }));
console.log(routeNotification({ kind: "shipped", orderId: "ORD-002", trackingId: "TRACK-100" }));
