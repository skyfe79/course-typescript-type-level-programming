// 같은 도메인을 곱 타입과 합 타입으로 모델링했을 때, 호출부 코드가 어떻게 달라지는지 봅니다.
// 세 번째 수령 방식을 덧붙였을 때 어느 쪽이 조용히 지나가는지도 나란히 비교합니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s14-data-modeling/order-fulfillment-callsite.ts

// codeStep 217 — 곱 타입 버전 호출부

interface OrderFulfillmentProduct {
  storeLocation?: string;
  deliveryAddress?: string;
}

function describeFulfillmentProduct(order: OrderFulfillmentProduct): string {
  if (order.storeLocation && order.deliveryAddress) {
    throw new Error("매장 위치와 배송 주소가 동시에 있습니다");
  }
  if (order.storeLocation) {
    return `매장 픽업: ${order.storeLocation}`;
  }
  if (order.deliveryAddress) {
    return `배송: ${order.deliveryAddress}`;
  }
  throw new Error("매장 위치도 배송 주소도 없습니다");
}

console.log(
  "곱 타입 호출부:",
  describeFulfillmentProduct({ storeLocation: "강남점" }),
);

// codeStep 218 — 합 타입 버전 호출부

type OrderFulfillmentSum =
  | { kind: "pickup"; storeLocation: string }
  | { kind: "delivery"; deliveryAddress: string };

function describeFulfillmentSum(order: OrderFulfillmentSum): string {
  switch (order.kind) {
    case "pickup":
      return `매장 픽업: ${order.storeLocation}`;
    case "delivery":
      return `배송: ${order.deliveryAddress}`;
    default: {
      const _exhaustive: never = order;
      throw new Error("다루지 않은 kind");
    }
  }
}

console.log(
  "합 타입 호출부:",
  describeFulfillmentSum({ kind: "pickup", storeLocation: "강남점" }),
);

export {};
