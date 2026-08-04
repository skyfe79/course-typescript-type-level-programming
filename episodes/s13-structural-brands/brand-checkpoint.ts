// JSON 경계를 통과한 UserId 값은 타입 브랜드 정보를 유지하지 않는다.
// 재진입 지점에서 parseUserId 체크포인트로 검증하고 UserId를 다시 붙인다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s13-structural-brands/brand-checkpoint.ts

// codeStep 197 — unknown 값을 UserId로 검증하고 복원하는 체크포인트

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

const payload = JSON.stringify({ userId: createUserId("u-42") });
const parsed = JSON.parse(payload) as { userId: string };
const restored = parseUserId(parsed.userId);
console.log(greetUser(restored)); // OK

console.log("요약 — JSON 경계를 지난 값은 재진입 체크포인트를 거쳐 다시 UserId로 다룬다.");

export {};
