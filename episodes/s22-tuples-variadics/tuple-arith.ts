// 튜플 길이를 숫자처럼 써서 타입 레벨 덧셈과 뺄셈을 만드는 방법을 보인다.
// 실행: node episodes/s22-tuples-variadics/tuple-arith.ts 3 4
// 검사: npx tsc --noEmit

// 지난 화의 Repeat와 같은 뼈대다. 목표 길이에 닿을 때까지 자리표시자를 누산기에 쌓는다.
type BuildTuple<N extends number, Acc extends unknown[] = []> =
  Acc["length"] extends N ? Acc : BuildTuple<N, [...Acc, unknown]>;

// 숫자 두 개를 각각 튜플로 만든 뒤 이어 붙이면, 이어 붙인 튜플의 길이가 덧셈 결과다.
type Add<A extends number, B extends number> =
  [...BuildTuple<A>, ...BuildTuple<B>]["length"];

// 앞부분이 B개짜리 튜플과 맞으면 남은 Rest의 길이가 뺄셈 결과다.
type Subtract<A extends number, B extends number> =
  BuildTuple<A> extends [...BuildTuple<B>, ...infer Rest] ? Rest["length"] : never;

type Sum = Add<3, 4>;
type Diff = Subtract<10, 3>;

// const s: Sum = 7은 Sum이 넓은 number여도 통과한다.
// Sum extends 7은 Sum이 정확히 7일 때만 true가 되므로 이 방향으로 증명한다.
const sumIsSeven: Sum extends 7 ? true : never = true;

// Diff도 같은 방식으로 넓은 number가 아니라 정확한 리터럴 7인지 확인한다.
const diffIsSeven: Diff extends 7 ? true : never = true;

// 3개짜리 튜플의 앞부분은 10개짜리 튜플과 맞을 수 없다. 조건이 거짓이 되어 결과는 never다.
// 뺄셈이 실패한 것이 아니라, 타입 레벨에 음수가 없어서 내놓을 답이 없는 것이다.
// 크고 작음을 비교할 때 보는 자리도 여기다. 앞부분이 맞으면 A가 B 이상이라는 뜻이다.
type NegativeResult = Subtract<3, 10>;

// never에는 어떤 값도 넣을 수 없다. 이 대입이 막힌다는 사실이 곧 결과가 never라는 증거다.
// @ts-expect-error - 0을 never 타입에 대입할 수 없다
const negativeHasNoAnswer: NegativeResult = 0;

// 타입으로 확인한 Add<3, 4>와 같은 계산을 런타임으로도 한 번 해서 나란히 둔다.
// 인자를 주지 않으면 기본값 3과 4가 쓰이므로 위 Sum과 같은 식이 그대로 찍힌다.
const [a = 3, b = 4] = process.argv.slice(2).map(Number);
console.log(`${a} + ${b} = ${a + b}`);

export {};
