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
// 그래서 다음 스텝에서 채울 본문 자리를 먼저 열어 둔다.
function parse(key: string): number | Date | { raw: string } {
  throw new Error("codeStep 177에서 채운다");
}

export {};
