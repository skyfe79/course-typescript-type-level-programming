// 인덱스 시그니처, Record, 매핑된 타입은 모두 아무 키나 받는다는 같은 말을 하는 것처럼 보인다.
// 그런데 세 방식의 keyof는 string | number, string, 리터럴 유니온으로 제각각 갈라진다.
// 같은 오타 키를 셋에 넣어, 원래 키 정보를 실제로 지키는 것이 어느 쪽인지 확인한다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s11-keyof-mapped/any-key-shapes.ts

// codeStep 171 — 세 가지 방식으로 같은 타입을 나란히 선언하고 keyof를 대조

type ByIndexSignature = { [key: string]: number };
type ByRecord = Record<string, number>;
type ByMappedType = { [K in "cpu" | "memory"]: number };

type KeysFromIndexSignature = keyof ByIndexSignature; // string | number
type KeysFromRecord = keyof ByRecord; // string
type KeysFromMappedType = keyof ByMappedType; // "cpu" | "memory"

// 앞의 둘은 같은 모양이지만 keyof 결과가 갈린다.
// 인덱스 시그니처는 JS가 숫자 키를 문자열로 다루는 것을 반영해 number까지 함께 내놓는다.
// Record는 그 자체가 매핑된 타입이라 keyof가 넘겨받은 키 타입 string을 그대로 돌려준다.

// 두 타입이 서로를 포함하면 같다고 본다. 이 화의 주인공은 아니므로 짧게만 쓴다.
type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

type CheckIndexSignatureKeys = Equals<KeysFromIndexSignature, string | number>;
type CheckRecordKeys = Equals<KeysFromRecord, string>;
type CheckMappedTypeKeys = Equals<KeysFromMappedType, "cpu" | "memory">;

const indexSignatureKeyCheck: CheckIndexSignatureKeys = true;
const recordKeyCheck: CheckRecordKeys = true;
const mappedTypeKeyCheck: CheckMappedTypeKeys = true;

const keyChecksPassed =
  indexSignatureKeyCheck && recordKeyCheck && mappedTypeKeyCheck;

// 타입은 실행 시점에 사라진다. 문자열 출력은 위 단언이 컴파일 시점에 보증한다.
console.log("키 결과 — 인덱스 시그니처:", "string | number");
console.log("키 결과 — 레코드:", "string");
console.log("키 결과 — 매핑된 타입:", '"cpu" | "memory"');
console.log("키 결과 — 타입 단언:", keyChecksPassed ? "통과" : "실패");

// codeStep 172 — 오타 하나로 세 타입을 대조

// 아무 문자열 키를 받기 때문에 오타도 정상 키처럼 통과한다. 이 통과가 결함이다.
const usageByIndex: ByIndexSignature = { cpu: 10, mem0ry: 5 };

// Record<string, number>도 모양은 같아서 같은 오타를 막지 못한다.
const usageByRecord: ByRecord = { cpu: 10, mem0ry: 5 };

console.log("오타 대입 — 인덱스 시그니처:", usageByIndex);
console.log("오타 대입 — 레코드:", usageByRecord);

// (컴파일 실패 사례 — 주석 처리 + 진단 원문)
// const usageByMapped: ByMappedType = { cpu: 10, mem0ry: 5 };
// error TS2561: Object literal may only specify known properties, but 'mem0ry' does not exist in type 'ByMappedType'. Did you mean to write 'memory'?

const usageByMappedCorrect: ByMappedType = { cpu: 10, memory: 5 };

console.log("올바른 대입 — 매핑된 타입:", usageByMappedCorrect);
console.log(
  "요약 — 오타를 잡은 방식:",
  "위 주석을 풀면 매핑된 타입에서만 오류가 난다.",
);

export {};
