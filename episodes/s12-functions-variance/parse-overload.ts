// parse() 오버로드로 키마다 서로 다른 반환 타입을 정한다.
// 호출부는 유니온을 직접 좁히지 않고 결과 타입을 바로 쓴다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s12-functions-variance/parse-overload.ts

// codeStep 176 — 오버로드 시그니처 세 개를 순서대로 선언

// 구체적인 리터럴 키 두 개를 먼저, 넓은 string을 마지막에 둔다.
// 구현 본문 없이 이 셋만 적고 저장하면 컴파일러가 세 번째 줄에서 곧바로 막는다.
// error TS2391: Function implementation is missing or not immediately following the declaration.
function parse(key: "count"): number;
function parse(key: "deployedAt"): Date;
function parse(key: string): { raw: string };

// codeStep 177 — 구현 시그니처로 세 경우를 처리

// 반환 타입은 세 오버로드의 반환 타입을 모두 덮을 만큼 넓어야 한다.
// 실제 분기는 이 본문에 있고, 위 목록은 호출부가 보는 계약이다.
function parse(key: string): number | Date | { raw: string } {
  if (key === "count") return Number(rawConfig[key]);
  if (key === "deployedAt") return new Date(rawConfig[key]);

  return { raw: rawConfig[key] };
}

// rawConfig가 함수 아래에 있는 이유: 오버로드 목록과 구현 시그니처 사이에는 다른 선언을 끼울 수
// 없다. 사이에 const 한 줄만 넣어도 위와 같은 TS2391이 난다.
const rawConfig: Record<string, string> = {
  count: "42",
  deployedAt: "2026-01-15",
  region: "ap-northeast-2",
};

// codeStep 178 — 호출부에서 반환 타입 확인

const count = parse("count");
console.log("count는 number라서 바로 더한다:", count + 1);

const deployedAt = parse("deployedAt");
console.log("deployedAt은 Date라서 바로 메서드를 부른다:", deployedAt.getFullYear());

const region = parse("region");
console.log("목록에 없는 키는 넓은 오버로드로 떨어진다:", JSON.stringify(region));

// 반환 타입이 유니온이 아니라 하나로 좁혀졌다는 증거 — 아래 두 줄은 컴파일되지 않는다.
// const year = region.getFullYear();
// error TS2339: Property 'getFullYear' does not exist on type '{ raw: string; }'.

// const raw = parse("count").raw;
// error TS2339: Property 'raw' does not exist on type 'number'.

console.log("요약 — 오버로드 목록이 키마다 반환 타입을 정하므로 호출부가 유니온을 직접 좁힐 필요가 없다.");

export {};
