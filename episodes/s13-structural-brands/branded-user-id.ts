// unique symbol은 복제할 수 없는 타입 수준의 표식을 만든다.
// 문자열에 브랜드 표식을 인터섹션으로 붙이면 UserId와 OrderId가 구조적으로 갈라진다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s13-structural-brands/branded-user-id.ts

// 문제 제시 — 브랜드가 없으면 같은 문자열 타입이라 서로 섞인다

type PlainUserId = string;
type PlainOrderId = string;

function describePlainUser(id: PlainUserId) {
  return `일반 사용자 ID: ${id}`;
}

const plainOrderId: PlainOrderId = "order-100";

console.log("브랜드가 없으면 주문 ID도 사용자 함수에 들어간다:", describePlainUser(plainOrderId));

// codeStep 193 — unique symbol과 인터섹션으로 UserId 브랜드 만들기

declare const userIdBrand: unique symbol;
type UserId = string & { readonly [userIdBrand]: true };

function makeUserId(raw: string): UserId {
  return raw as UserId;
}

declare const orderIdBrand: unique symbol;
type OrderId = string & { readonly [orderIdBrand]: true };

function makeOrderId(raw: string): OrderId {
  return raw as OrderId;
}

const userId = makeUserId("u-42");
const orderId = makeOrderId("order-100");

function describeUser(id: UserId) {
  return `브랜드 사용자 ID: ${id}`;
}

function describeOrder(id: OrderId) {
  return `브랜드 주문 ID: ${id}`;
}

console.log("UserId는 사용자 함수에 들어간다:", describeUser(userId));
console.log("OrderId는 주문 함수에 들어간다:", describeOrder(orderId));

// 브랜드가 갈라놓는 것 — 서로 다른 브랜드는 같은 문자열이어도 섞이지 않는다.
// describeUser(orderId);
// episodes/s13-structural-brands/branded-user-id.ts(50,14): error TS2345: Argument of type 'OrderId' is not assignable to parameter of type 'UserId'.
//   Type 'OrderId' is not assignable to type '{ readonly [userIdBrand]: true; }'.
//     Property '[userIdBrand]' is missing in type 'String & { readonly [orderIdBrand]: true; }' but required in type '{ readonly [userIdBrand]: true; }'.

// describeOrder(userId);
// episodes/s13-structural-brands/branded-user-id.ts(55,15): error TS2345: Argument of type 'UserId' is not assignable to parameter of type 'OrderId'.
//   Type 'UserId' is not assignable to type '{ readonly [orderIdBrand]: true; }'.
//     Property '[orderIdBrand]' is missing in type 'String & { readonly [userIdBrand]: true; }' but required in type '{ readonly [orderIdBrand]: true; }'.

console.log("런타임 값:", userId);
console.log("런타임 typeof:", typeof userId);

console.log("요약 — 브랜드 타입은 컴파일 시점에 ID 종류를 가르고, 실행 시점 값은 문자열 그대로 남는다.");

export {};
