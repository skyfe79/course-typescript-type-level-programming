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

// codeStep 191 — 변수에 먼저 저장해 전달

const opts = { strict: true, timeout: 5000 };

console.log("변수를 거치면 같은 값도 통과한다:", validate(opts));

// codeStep 192 — 에러가 사라지는 지점 확인

console.log("같은 변수를 다시 넘겨도 통과한다:", validate(opts));
console.log("같은 변수를 한 번 더 넘겨도 통과한다:", validate(opts));

// 컴파일 실패 사례 — 새 객체 리터럴을 호출 자리에 직접 쓰면 다시 timeout이 걸린다.
// validate({ strict: true, timeout: 5000 });
// episodes/s13-structural-brands/freshness-boundary.ts(34,26): error TS2353: Object literal may only specify known properties, and 'timeout' does not exist in type 'CheckOptions'.

// 컴파일 실패 사례 — 타입 주석이 붙은 변수 선언 자리에서는 리터럴이 바로 검사된다.
// const typedOpts: CheckOptions = { strict: true, timeout: 5000 };
// episodes/s13-structural-brands/freshness-boundary.ts(38,49): error TS2353: Object literal may only specify known properties, and 'timeout' does not exist in type 'CheckOptions'.

console.log("스프레드로 새 객체를 만들어도 초과 속성 검사는 통과한다:", validate({ ...opts }));

console.log("요약 — 초과 속성 검사는 객체 리터럴이 타입이 정해진 자리에서 갓 만들어질 때만 적용된다.");

export {};
