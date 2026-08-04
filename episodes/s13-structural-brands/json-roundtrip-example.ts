// 브랜드 UserId 값은 JSON 문자열 안에서 평범한 string으로 직렬화된다.
// 역직렬화 뒤에는 parseUserId 재진입 체크포인트를 지나야 다시 UserId로 다룰 수 있다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s13-structural-brands/json-roundtrip-example.ts

declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

type UserId = Brand<string, "UserId">;

function createUserId(raw: string): UserId {
  return raw as UserId;
}

function greetUser(id: UserId): string {
  return `Hello, user ${id}`;
}

function parseUserId(raw: unknown): UserId {
  if (typeof raw !== "string") {
    throw new Error("UserId must be a string");
  }
  return createUserId(raw);
}

// codeStep 198 — 브랜드 값을 JSON으로 직렬화
const original = createUserId("u-42");
const payload = JSON.stringify({ id: original });
console.log(payload); // {"id":"u-42"}

// codeStep 199 — 역직렬화된 값에 재진입 체크포인트 적용
const parsedPayload = JSON.parse(payload) as { id: string };
const restored = parseUserId(parsedPayload.id);

export {};
