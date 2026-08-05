// Value는 소스의 모양을 보존하는 토큰이나 AST가 아니라, 프로그램을 실행하는 동안
// 실제로 흘러다니는 데이터다. kind로 먼저 좁힌 뒤에만 value를 해당 타입으로 다룰 수 있다.
export type Value =
  | { readonly kind: "number"; readonly value: number }
  | { readonly kind: "string"; readonly value: string }
  | { readonly kind: "boolean"; readonly value: boolean };

// Value에 새 런타임 종류가 생기면 판별자 목록도 자동으로 따라가게 한다.
export type ValueKind = Value["kind"];
