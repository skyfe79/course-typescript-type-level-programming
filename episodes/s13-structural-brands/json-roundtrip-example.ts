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

// codeStep 200 — 브랜드 복원 확인
console.log(greetUser(restored)); // OK

// @ts-expect-error - 체크포인트를 거치지 않은 순수 string은 여전히 UserId가 아니다
greetUser(parsedPayload.id);
// 실측 진단(@ts-expect-error 한 줄만 제거했을 때):
// episodes/s13-structural-brands/json-roundtrip-example.ts(38,11): error TS2345: Argument of type 'string' is not assignable to parameter of type 'UserId'.
//   Type 'string' is not assignable to type '{ readonly [brand]: "UserId"; }'.

console.log("요약 — JSON 왕복 뒤에는 재진입 체크포인트로 UserId 브랜드를 다시 붙인다.");

export {};
