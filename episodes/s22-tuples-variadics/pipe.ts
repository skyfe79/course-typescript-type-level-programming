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
