// 함수 오버로드는 호출부에서 구현 시그니처가 아니라 오버로드 목록을 본다.
// 목록은 위에서부터 검사되므로 먼저 맞는 시그니처가 호출 결과 타입을 정한다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s12-functions-variance/overload-order.ts

// codeStep 175 — 오버로드 시그니처 순서가 호출 결과 타입을 바꾼다

type DeviceInfo = { kind: "device"; boost: number };
type PlainInfo = { kind: string };

function wrap(value: "cpu" | "gpu"): DeviceInfo;
function wrap(value: string): PlainInfo;
function wrap(value: string): DeviceInfo | PlainInfo {
  if (value === "cpu" || value === "gpu") {
    return { kind: "device" as const, boost: 100 };
  }

  return { kind: value };
}

const wrappedCpu = wrap("cpu");
console.log("좁은 union 시그니처 선택 — boost:", wrappedCpu.boost);

const wrappedSsd = wrap("ssd");
console.log("넓은 string 시그니처 선택:", JSON.stringify(wrappedSsd));

// 아래 wrapWide는 wrap과 본문이 글자 그대로 같고, 두 오버로드 시그니처의 순서만 반대다.
// 그래서 여기서 달라지는 것은 동작이 아니라 컴파일러가 호출부에서 보는 타입뿐이다.
function wrapWide(value: string): PlainInfo;
function wrapWide(value: "cpu" | "gpu"): DeviceInfo;
function wrapWide(value: string): DeviceInfo | PlainInfo {
  if (value === "cpu" || value === "gpu") {
    return { kind: "device" as const, boost: 100 };
  }

  return { kind: value };
}

const wideCpu = wrapWide("cpu");
console.log("순서를 뒤집어도 런타임 값은 같음:", JSON.stringify(wideCpu));

// (컴파일 실패 사례 — 주석 처리 + 진단 원문)
// console.log(wideCpu.boost);
// error TS2339: Property 'boost' does not exist on type 'PlainInfo'.

function exact(value: string): PlainInfo;
function exact(value: "cpu"): DeviceInfo;
function exact(value: string): DeviceInfo | PlainInfo {
  if (value === "cpu") {
    return { kind: "device" as const, boost: 100 };
  }

  return { kind: value };
}

// 여기는 wrapWide와 순서가 같은데 결과가 다르다. 좁은 쪽 매개변수가 union이 아니라
// 인자와 정확히 같은 단일 리터럴이면, 컴파일러는 목록을 훑기 전에 그것을 먼저 골라낸다.
// 그래서 넓은 string 시그니처가 앞에 있는데도 아래 boost 읽기가 통과한다.
const exactCpu = exact("cpu");
console.log("단일 리터럴은 순서를 뒤집어도 좁은 쪽 — boost:", exactCpu.boost);

console.log("요약 — 오버로드 목록은 위에서부터 훑으므로, 선언 순서가 호출 결과의 타입을 바꾼다.");

export {};
