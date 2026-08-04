// 배송 방식을 선택적 필드 두 개로 두면 잘못된 조합도 값으로 만들 수 있습니다.
// 같은 도메인을 판별 유니온으로 바꾸면 그 조합 자체를 타입에서 막을 수 있습니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s14-data-modeling/order-fulfillment.ts

// codeStep 215 — 곱 타입으로 배송 방식 나타내기

interface OrderFulfillmentProduct {
  storeLocation?: string;
  deliveryAddress?: string;
}

const pickup: OrderFulfillmentProduct = { storeLocation: "강남점" };
const delivery: OrderFulfillmentProduct = {
  deliveryAddress: "서울시 마포구 …",
};

// 둘 다 채워도 타입 검사기는 막지 않는다 — 잘못된 상태
const both: OrderFulfillmentProduct = {
  storeLocation: "강남점",
  deliveryAddress: "서울시 마포구 …",
};

// 둘 다 비워도 타입 검사기는 막지 않는다 — 역시 잘못된 상태
const neither: OrderFulfillmentProduct = {};

// codeStep 216 — 같은 도메인을 판별 유니온으로 다시 쓰기

type OrderFulfillmentSum =
  | { kind: "pickup"; storeLocation: string }
  | { kind: "delivery"; deliveryAddress: string };

const sumPickup: OrderFulfillmentSum = {
  kind: "pickup",
  storeLocation: "강남점",
};
const sumDelivery: OrderFulfillmentSum = {
  kind: "delivery",
  deliveryAddress: "서울시 마포구 …",
};

const sumBoth: OrderFulfillmentSum = {
  kind: "pickup",
  storeLocation: "강남점",
  // @ts-expect-error - kind가 "pickup"이면 deliveryAddress를 함께 넣을 수 없다
  deliveryAddress: "서울시 마포구 …",
};

console.log("곱 타입이 통과시킨 잘못된 값:", both, neither);
console.log("합 타입이 허용한 값:", sumPickup, sumDelivery);

export {};
