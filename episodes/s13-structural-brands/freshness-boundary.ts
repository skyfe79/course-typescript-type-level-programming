// 초과 속성 검사는 객체 리터럴이 태어나는 자리에서 한 번만 걸린다.
// 같은 값도 직접 넘기는지, 변수를 거치는지에 따라 결과가 갈린다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s13-structural-brands/freshness-boundary.ts

// codeStep 190 — 초과 속성 있는 리터럴로 에러 재현

interface CheckOptions {
  strict: boolean;
}

function validate(opts: CheckOptions) {
  return opts.strict ? "엄격 검사" : "기본 검사";
}

console.log("정확한 리터럴은 통과한다:", validate({ strict: true }));

// 컴파일 실패 사례 — 객체 리터럴을 직접 넘기면 CheckOptions에 없는 timeout이 걸린다.
// validate({ strict: true, timeout: 5000 });
// episodes/s13-structural-brands/freshness-boundary.ts(19,26): error TS2353: Object literal may only specify known properties, and 'timeout' does not exist in type 'CheckOptions'.

export {};
