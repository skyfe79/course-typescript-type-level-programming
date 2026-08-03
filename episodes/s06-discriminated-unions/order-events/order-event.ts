type OrderEvent =
  | { kind: "created"; orderId: string }
  | { kind: "paid"; orderId: string; amount: number }
  | { kind: "shipped"; orderId: string; trackingId: string };

export type { OrderEvent };
