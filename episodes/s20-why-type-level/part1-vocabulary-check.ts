// Part 1에서 배운 유니온, 타입 좁히기, 제네릭, keyof, mapped 타입을 한 파일에서 다시 확인한다.
// 실행: node episodes/s20-why-type-level/part1-vocabulary-check.ts
// 검사: npx tsc --noEmit

type ConfigValue =
  | { kind: "string"; value: string }
  | { kind: "number"; value: number }
  | { kind: "boolean"; value: boolean };

function describe(v: ConfigValue): string {
  switch (v.kind) {
    case "string":
      return `문자열: ${v.value}`;
    case "number":
      return `숫자: ${v.value}`;
    case "boolean":
      return `불리언: ${v.value}`;
  }
}

// 갈래 하나를 빠뜨리면 어느 경로도 잡지 못한 값이 남아 반환 타입이 string을 만족하지 못한다.
// (컴파일 실패 사례 — 주석 처리 + 진단 원문)
/*
function describeWithoutBoolean(v: ConfigValue): string {
  switch (v.kind) {
    case "string":
      return `문자열: ${v.value}`;
    case "number":
      return `숫자: ${v.value}`;
  }
}
*/
// error TS2366: Function lacks ending return statement and return type does not include 'undefined'.

function pickFirst<T>(list: T[]): T | undefined {
  return list[0];
}

type ConfigValueKey = keyof ConfigValue;

type ReadonlyConfigValue<T> = { readonly [K in keyof T]: T[K] };

const values: ConfigValue[] = [
  { kind: "string", value: "production" },
  { kind: "number", value: 8080 },
  { kind: "boolean", value: true },
];

for (const v of values) {
  console.log(describe(v));
}

console.log("pickFirst:", pickFirst(values)?.kind);

const configValueKeys: ConfigValueKey[] = ["kind", "value"];
console.log("ConfigValueKey:", configValueKeys);

// 유니온에 keyof를 쓰면 모든 갈래에 공통으로 있는 키만 남는다.
// (컴파일 실패 사례 — 주석 처리 + 진단 원문)
// const wrongConfigValueKey: ConfigValueKey = "missing";
// error TS2322: Type '"missing"' is not assignable to type '"kind" | "value"'.

const firstReadonlyValue: ReadonlyConfigValue<ConfigValue> = values[0];
console.log("ReadonlyConfigValue:", firstReadonlyValue);

// mapped 타입으로 readonly가 붙었기 때문에 프로퍼티 재대입은 막힌다.
// (컴파일 실패 사례 — 주석 처리 + 진단 원문)
// firstReadonlyValue.value = "staging";
// error TS2540: Cannot assign to 'value' because it is a read-only property.

export {};
