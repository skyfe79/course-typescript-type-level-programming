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

export {};
