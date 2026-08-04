// 정체성을 가진 엔티티 User와 구조로 비교되는 값 객체 Money를 나란히 보여줍니다.
// User는 식별자로, Money는 모든 필드의 값으로 동등성을 판단합니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s14-data-modeling/domain-modeling-example.ts

// codeStep 201

declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };
type UserId = Brand<string, "UserId">;

function createUserId(raw: string): UserId {
  return raw as UserId;
}

interface User {
  readonly id: UserId;
  name: string;
}

function sameUser(a: User, b: User): boolean {
  // 정체성 비교
  return a.id === b.id;
}

interface Money {
  readonly amount: number;
  readonly currency: "USD" | "KRW";
}

function sameMoney(a: Money, b: Money): boolean {
  // 구조 비교
  return a.amount === b.amount && a.currency === b.currency;
}

const alice: User = {
  id: createUserId("user-1"),
  name: "앨리스",
};

const renamedAlice: User = {
  id: alice.id,
  name: "앨리스 김",
};

const bob: User = {
  id: createUserId("user-2"),
  name: "밥",
};

console.log("이름만 바뀐 같은 식별자:", sameUser(alice, renamedAlice)); // true
console.log("식별자가 다른 사용자:", sameUser(alice, bob)); // false

const price: Money = {
  amount: 1000,
  currency: "KRW",
};

const samePrice: Money = {
  amount: 1000,
  currency: "KRW",
};

const dollarPrice: Money = {
  amount: 1000,
  currency: "USD",
};

console.log("값이 같은 서로 다른 객체:", sameMoney(price, samePrice)); // true
console.log("통화만 다른 금액:", sameMoney(price, dollarPrice)); // false
console.log("엔티티는 식별자로, 값 객체는 구조로 동등성을 판단합니다.");

export {};
