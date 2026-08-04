// schemaVersion을 판별자로 사용해 레코드 버전을 구분하는 방법을 보여줍니다.
// 선택적 필드는 최신 버전에만 열어 두고, 이전 버전은 마이그레이션을 거쳐 사용합니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s14-data-modeling/versioned-record-migration.ts

// codeStep 211 — 버전 있는 주문 레코드 마이그레이션

type OrderV1 = {
  schemaVersion: 1;
  orderId: string;
  quantity: number;
  unitPriceCents: number;
};

type OrderV2 = {
  schemaVersion: 2;
  orderId: string;
  quantity: number;
  unitPriceCents: number;
  giftMessage?: string;
};

function migrateOrderV1ToV2(v1: OrderV1): OrderV2 {
  return { ...v1, schemaVersion: 2 };
}

type VersionedOrder = OrderV1 | OrderV2;

function toLatest(order: VersionedOrder): OrderV2 {
  if (order.schemaVersion === 1) return migrateOrderV1ToV2(order);
  return order;
}

function readGiftMessage(order: OrderV2): string {
  return order.giftMessage ?? "(no gift message)";
}

const oldOrder: OrderV1 = {
  schemaVersion: 1,
  orderId: "o-9",
  quantity: 1,
  unitPriceCents: 500,
};

console.log(readGiftMessage(toLatest(oldOrder)));

export {};
