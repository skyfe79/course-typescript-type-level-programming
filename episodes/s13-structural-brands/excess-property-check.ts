// 구조적 타이핑에서는 필요한 프로퍼티 모양이 맞으면 이름이 달라도 통과한다.
// 다만 갓 만든 객체 리터럴은 초과 속성 검사를 한 번 더 받는다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s13-structural-brands/excess-property-check.ts

// codeStep 188 — 리터럴을 직접 넘기면 초과 속성 검사가 걸린다

interface Options {
  verbose: boolean;
}

function run(opts: Options) {
  return opts.verbose ? "verbose" : "quiet";
}

interface EnvcheckOptions {
  verbose: boolean;
}

interface CommandOptions {
  verbose: boolean;
}

const envcheckOptions: EnvcheckOptions = { verbose: true };
const commandOptions: CommandOptions = envcheckOptions;

console.log("같은 구조의 두 인터페이스는 서로 대입된다:", run(commandOptions));

interface WideOptions {
  verbose: boolean;
  extra: number;
}

const wideOptions: WideOptions = { verbose: true, extra: 1 };

console.log("초과 필드를 선언한 타입의 변수도 Options 자리에 들어간다:", run(wideOptions));

// 컴파일 실패 사례 — 객체 리터럴을 직접 넘기면 Options에 없는 extra가 걸린다.
// run({ verbose: true, extra: 1 });
// episodes/s13-structural-brands/excess-property-check.ts(39,22): error TS2353: Object literal may only specify known properties, and 'extra' does not exist in type 'Options'.

export {};
