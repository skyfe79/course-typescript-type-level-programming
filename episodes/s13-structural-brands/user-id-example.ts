// Brand<T, B> 유틸리티로 UserId 브랜드 타입을 정의한다.
// 순수 string은 거부되고 생성자를 거친 값만 UserId 자리에 들어간다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s13-structural-brands/user-id-example.ts

// codeStep 194 — UserId 브랜드 타입 정의

declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

type UserId = Brand<string, "UserId">;

function createUserId(raw: string): UserId {
  return raw as UserId;
}

function greetUser(id: UserId): string {
  return `Hello, user ${id}`;
}

// codeStep 195 — 순수 string 전달 시 에러 확인

const rawId: string = "u-42";

// @ts-expect-error - 순수 string은 UserId 브랜드가 없어 greetUser에 전달할 수 없다
greetUser(rawId);
// 실측 진단(@ts-expect-error 한 줄만 제거했을 때):
// episodes/s13-structural-brands/user-id-example.ts(25,11): error TS2345: Argument of type 'string' is not assignable to parameter of type 'UserId'.
//   Type 'string' is not assignable to type '{ readonly [brand]: "UserId"; }'.

// codeStep 196 — 스마트 생성자를 거친 값으로 통과

const brandedId = createUserId("u-42");
console.log(greetUser(brandedId)); // OK

console.log("rawId와 brandedId는 런타임에서 같은 값인가:", rawId === brandedId);
console.log("rawId의 런타임 typeof:", typeof rawId);
console.log("brandedId의 런타임 typeof:", typeof brandedId);
console.log("요약 — 런타임 값은 같지만, 순수 string 호출은 실패하고 UserId 호출은 통과한다.");

export {};
