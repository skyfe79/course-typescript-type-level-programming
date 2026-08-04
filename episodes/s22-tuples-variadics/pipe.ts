// pipe()는 여러 함수를 왼쪽에서 오른쪽으로 이어 실행하는 함수다.
// 실행: node episodes/s22-tuples-variadics/pipe.ts "  the quick brown fox  "
// 검사: npx tsc --noEmit

// 함수 사슬에서 이웃한 두 함수가 맞물리려면, 앞 함수의 반환 타입을 뒤 함수의 매개변수 타입이
// 받아야 한다. Chain은 튜플 맨 앞의 A, B를 꺼내 이 관계를 확인한 뒤, B부터 다시 재귀로 검사한다.
// 하나라도 어긋나면 false가 되고, 끝까지 통과하면 true가 된다.
type Chain<Fns extends readonly unknown[]> =
  Fns extends readonly [infer A, infer B, ...infer Rest]
    ? A extends (arg: never) => infer RA
      ? B extends (arg: RA) => unknown
        ? Chain<[B, ...Rest]>
        : false
      : false
    : true;

// pipe()가 돌려주는 함수의 매개변수는 첫 함수의 매개변수와 같다.
type FirstParam<Fns extends readonly unknown[]> =
  Fns extends readonly [infer First, ...unknown[]]
    ? First extends (arg: infer A) => unknown ? A : never
    : never;

// pipe()가 돌려주는 함수의 반환값은 마지막 함수의 반환값과 같다.
type LastReturn<Fns extends readonly unknown[]> =
  Fns extends readonly [...unknown[], infer Last]
    ? Last extends (arg: never) => infer R ? R : never
    : never;

function pipe<Fns extends readonly [(arg: never) => unknown, ...((arg: never) => unknown)[]]>(
  ...fns: Chain<Fns> extends true ? Fns : never
): (arg: FirstParam<Fns>) => LastReturn<Fns> {
  // 호출자가 넘긴 함수 사슬의 연결성은 Chain<Fns>가 이미 검사한다. 구현 안쪽에서는 각 단계를
  // unknown 값 하나를 받아 unknown 값을 돌려주는 함수처럼 순서대로 실행하면 충분하다.
  // 그래서 as unknown as를 거쳐, 구체적인 타입 계산은 바깥 계약에 맡기고 실행 목록만 만든다.
  const steps = fns as unknown as readonly ((value: unknown) => unknown)[];
  return (arg: FirstParam<Fns>) =>
    steps.reduce<unknown>((value, step) => step(value), arg) as LastReturn<Fns>;
}

const trim = (s: string) => s.trim();
const toUpperCase = (s: string) => s.toUpperCase();

const shout = pipe(trim, toUpperCase);

// 두 함수만 이어도 첫 매개변수와 마지막 반환값의 자리 정보는 사라지지 않는다.
const shoutResult: string = shout("  hello  ");

console.log("두 함수 pipe 결과:", shoutResult);

// 사슬을 더 길게 만들어도 검사 방식은 같다. string을 number로 바꾸는 countWords 뒤에는
// number를 받는 함수만 올 수 있고, 마지막 toLabel이 최종 반환 타입을 string으로 고정한다.
const countWords = (s: string) => s.split(" ").filter(Boolean).length;
const double = (n: number) => n * 2;
const toLabel = (n: number) => `count: ${n}`;

const run = pipe(trim, toUpperCase, countWords, double, toLabel);

// run은 처음 함수 trim의 매개변수 string을 받고, 마지막 함수 toLabel의 반환값 string을 돌려준다.
const runTypeCheck: (arg: string) => string = run;
const runResult: string = runTypeCheck("  type level programming  ");

console.log(run(process.argv[2] ?? ""));

// 일부러 string을 받아야 하는 자리에 number를 받는 average를 끼워 넣으면 함수 사슬 전체가
// never 자리로 접힌다. 그래서 컴파일러 진단은 "세 번째 인자만 틀렸다"가 아니라
// "인자 목록 전체가 pipe의 매개변수 never에 들어갈 수 없다"로 나온다.
const average = (n: number) => n / 2;

// @ts-expect-error - toUpperCase의 반환값 string을 average의 매개변수 number가 받을 수 없다.
const brokenRun = pipe(trim, toUpperCase, average, double, toLabel);
// 실측 진단(위 @ts-expect-error 한 줄을 같은 줄 수의 다른 주석으로 바꿔 지시문만 껐을 때):
// episodes/s22-tuples-variadics/pipe.ts(70,24): error TS2345: Argument of type '[(s: string) => string, (s: string) => string, (n: number) => number, (n: number) => number, (n: number) => string]' is not assignable to parameter of type 'never'.

// 어느 연결이 깨졌는지 보고 싶다면 pipe() 호출 진단만 보지 말고 Chain을 직접 평가해 본다.
// 좋은 사슬은 true로 남고, average가 들어간 사슬은 false로 접힌다.
type GoodPipeChain = Chain<[typeof trim, typeof toUpperCase, typeof countWords, typeof double, typeof toLabel]>;
type BrokenPipeChain = Chain<[typeof trim, typeof toUpperCase, typeof average, typeof double, typeof toLabel]>;
type UpperToAverage = Chain<[typeof toUpperCase, typeof average]>;

// 각 검사 결과를 그 자리에 리터럴로 적어 둔다. Chain이 다른 값으로 계산됐다면 이 대입 자체가
// 타입 검사에서 막히므로, 이 세 줄이 통과한다는 사실이 곧 검사 결과에 대한 증명이 된다.
const goodPipeChain: GoodPipeChain = true;
const brokenPipeChain: BrokenPipeChain = false;
const upperToAverage: UpperToAverage = false;

console.log("좋은 함수 사슬 타입 검사:", goodPipeChain);
console.log("깨진 함수 사슬 타입 검사:", brokenPipeChain);
console.log("어긋난 이웃 검사:", upperToAverage);

export {};
