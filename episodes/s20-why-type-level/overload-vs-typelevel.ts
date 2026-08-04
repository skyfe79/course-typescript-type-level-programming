// 오버로드와 조건부 타입 버전을 나란히 두고 호출 지점 개수로 선택 기준을 정한다.
// 실행: node episodes/s20-why-type-level/overload-vs-typelevel.ts
// 검사: npx tsc --noEmit
// 컴파일 시간 측정: npx tsc --noEmit --extendedDiagnostics

// 오버로드 버전 — 호출 지점이 적을 때
function parseId(input: string): { kind: "string"; value: string };
function parseId(input: number): { kind: "number"; value: number };
function parseId(input: string | number) {
  return typeof input === "string"
    ? { kind: "string" as const, value: input }
    : { kind: "number" as const, value: input };
}

// 타입 레벨 버전 — 호출 지점이 많을 때
type ParsedId<T extends string | number> = T extends string
  ? { kind: "string"; value: T }
  : { kind: "number"; value: T };

function parseIdTyped<T extends string | number>(input: T): ParsedId<T> {
  return (typeof input === "string"
    ? { kind: "string", value: input }
    : { kind: "number", value: input }) as ParsedId<T>;
}

// 에러 메시지 비용은 짐작하지 말고, 같은 틀린 인자를 두 버전에 각각 넣어 실제 진단을 재 본다.
// (컴파일 실패 사례 — 주석 처리 + 진단 원문)
// parseId(true);
// error TS2769: No overload matches this call.
//   The last overload gave the following error.
//     Argument of type 'boolean' is not assignable to parameter of type 'number'.

// (컴파일 실패 사례 — 주석 처리 + 진단 원문)
// parseIdTyped(true);
// error TS2345: Argument of type 'boolean' is not assignable to parameter of type 'string | number'.

// 재 본 결과, 이 규모에서는 오버로드 쪽 메시지가 세 줄이고 타입 레벨 쪽이 한 줄이다.
// 에러 메시지 비용이 자동으로 타입 레벨 쪽에 더 무겁게 붙는 것이 아니므로,
// 결정 기준은 메시지에 대한 짐작이 아니라 호출 지점 개수라는 숫자다.

// 결정 기준: 호출 지점 개수 N을 세서 비교
const CALL_SITE_THRESHOLD = 3;
function decide(callSiteCount: number): string {
  return callSiteCount < CALL_SITE_THRESHOLD
    ? "오버로드를 쓰세요"
    : "타입 레벨 버전을 쓰세요";
}

console.log(parseId("u_42"));
console.log(parseIdTyped("u_42"));
console.log(decide(2));
console.log(decide(5));

export {};
