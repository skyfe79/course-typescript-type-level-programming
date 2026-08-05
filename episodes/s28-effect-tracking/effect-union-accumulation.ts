// chain이 각 단계의 이펙트 유니온을 합쳐, 합성을 반복해도 정확한 이펙트 집합을 보존하게 한다.
// 실행: node episodes/s28-effect-tracking/effect-union-accumulation.ts
// 검사: npx tsc --noEmit

// codeStep 402 — map 대응 함수에 이펙트 유니온 합치기

// 이 강좌에서 추적할 수 있는 부수 효과의 이름을 하나의 유니온으로 모은다.
type EffectTag = "fileIO" | "network" | "logging";

// Result는 프로그램을 실행한 결과이고, Effects는 그 과정에서 일어날 부수 효과다.
// effects는 선택 필드이므로 실제 객체에 넣지 않아도 되지만, 타입 구조에는 Effects를 남긴다.
interface Effectful<Result, Effects extends EffectTag> {
  readonly effects?: Effects;
  run(): Result;
}

// 두 타입이 정확히 같은지 판별한다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// 아직 파일을 읽지 않고, run()을 호출할 때 읽은 결과를 돌려줄 프로그램 값만 만든다.
function readConfig(path: string): Effectful<string, "fileIO"> {
  return { run: () => `<config from ${path}>` };
}

// 로그 출력 역시 즉시 실행하지 않고, run()으로 실행할 수 있는 프로그램 값으로 미룬다.
function writeLog(message: string): Effectful<void, "logging"> {
  return { run: () => console.log(message) };
}

// 순진한 합성은 두 단계의 이펙트를 EffectTag 전체로 받는다.
// 호출부가 fileIO와 logging만 전달해도 반환 타입에서는 network까지 포함한 전체 집합으로 넓어진다.
function chainNaive<A, B>(
  step: Effectful<A, EffectTag>,
  next: (a: A) => Effectful<B, EffectTag>
): Effectful<B, EffectTag> {
  return { run: () => next(step.run()).run() };
}

const naiveStep = chainNaive(readConfig("app.json"), (config) => writeLog(`loaded ${config}`));

// 호버 대신 Eq에 true를 대입해, 순진한 결과가 EffectTag 전체로 넓어졌음을 컴파일러로 실측한다.
const naiveStepLosesSpecificEffects: Eq<
  typeof naiveStep,
  Effectful<void, EffectTag>
> = true;

// 실행해 보면 순진한 합성도 결과는 똑같다. 사라진 것은 런타임 동작이 아니라 타입이 담고 있던 정보뿐이다.
console.log("chainNaive로 이어 붙인 프로그램 실행:");
naiveStep.run();

// EA와 EB는 EffectTag 안에서 각각 독립적으로 추론되는 벗겨진 타입 매개변수다.
// 따라서 반환 타입은 전체 EffectTag가 아니라, 호출부에서 들어온 실제 두 이펙트 EA | EB가 된다.
function chain<A, B, EA extends EffectTag, EB extends EffectTag>(
  step: Effectful<A, EA>,
  next: (a: A) => Effectful<B, EB>
): Effectful<B, EA | EB> {
  return { run: () => next(step.run()).run() };
}

// codeStep 403 — 두 단계를 이어 붙여 누적 결과 확인하기

const step1 = readConfig("app.json");
const step2 = chain(step1, (config) => writeLog(`loaded ${config}`));
const step3 = chain(step2, () => readConfig("secrets.json"));

// 첫 합성에서는 fileIO와 logging이 합쳐진다.
const step2CarriesBothEffects: Eq<
  typeof step2,
  Effectful<void, "fileIO" | "logging">
> = true;

// 두 번째 fileIO는 유니온에 중복해서 쌓이지 않는다.
// 같은 유니온 원소는 하나로 합쳐지므로, 합성을 반복한 뒤에도 이펙트 집합은 정확히 두 개다.
const step3KeepsUniqueEffects: Eq<
  typeof step3,
  Effectful<string, "fileIO" | "logging">
> = true;

// step3를 실행하면 앞 단계의 loaded 로그가 먼저 찍히고, 마지막 파일 읽기 결과가 반환된다.
console.log("chain으로 이어 붙인 프로그램 실행:");
console.log("step3 run() 최종 결과:", step3.run());

export {};
