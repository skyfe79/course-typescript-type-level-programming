// 서로 다른 세 단계를 합성해, 파이프라인이 수행할 모든 이펙트가 타입에 남는다는 것을 증명한다.
// 실행: node episodes/s28-effect-tracking/effect-pipeline-example.ts
// 검사: npx tsc --noEmit

// codeStep 404 — 이펙트가 다른 단계 세 개 정의하기

// 이 강좌에서 추적할 수 있는 부수 효과의 이름을 하나의 유니온으로 모은다.
type EffectTag = "fileIO" | "network" | "logging";

// Result는 프로그램을 실행한 결과이고, Effects는 실행 중 일어날 부수 효과다.
// effects는 팬텀 필드라서 런타임 객체에 넣지 않아도 되지만, 타입에는 Effects를 보존한다.
interface Effectful<Result, Effects extends EffectTag> {
  readonly effects?: Effects;
  run(): Result;
}

// 두 타입이 정확히 같은지 판별한다. true를 상수에 대입하면 타입 주장이 계속 검사된다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// 앞 화에서 만든 합성 도구다. 각 단계의 이펙트를 EA와 EB로 따로 추론한 뒤 유니온으로 합친다.
function chain<A, B, EA extends EffectTag, EB extends EffectTag>(
  step: Effectful<A, EA>,
  next: (a: A) => Effectful<B, EB>
): Effectful<B, EA | EB> {
  return { run: () => next(step.run()).run() };
}

// 세 함수는 나중에 합성할 파이프라인의 재료다.
// 각 반환 타입에는 그 단계가 담당하는 이펙트 태그 하나만 정확히 적혀 있다.
function readFileStep(path: string): Effectful<string, "fileIO"> {
  return { run: () => `<bytes from ${path}>` };
}

function fetchStep(url: string): Effectful<string, "network"> {
  return { run: () => `<response from ${url}>` };
}

function logStep(message: string): Effectful<void, "logging"> {
  return { run: () => console.log(message) };
}

// 편집기 호버 대신 Eq 상수로 각 함수가 자기 이펙트 하나만 반환함을 못 박는다.
const readFileStepPerformsFileIO: Eq<
  ReturnType<typeof readFileStep>,
  Effectful<string, "fileIO">
> = true;
const fetchStepPerformsNetwork: Eq<
  ReturnType<typeof fetchStep>,
  Effectful<string, "network">
> = true;
const logStepPerformsLogging: Eq<
  ReturnType<typeof logStep>,
  Effectful<void, "logging">
> = true;

// 아직 세 단계를 이어 붙이지 않았다. 각각 따로 실행해 한 번에 이펙트 하나만 수행한다.
console.log("readFileStep 단독 실행:", readFileStep("input.txt").run());
console.log("fetchStep 단독 실행:", fetchStep("https://api.example.com").run());
logStep("logStep 단독 실행: 준비 완료").run();

// codeStep 405 — 단계를 이어 붙여 파이프라인 만들기

// 안쪽 chain은 파일 읽기와 네트워크 요청을 잇고, 바깥 chain은 그 결과에 로깅을 잇는다.
// 콜백의 data와 response를 보면 앞 단계의 결과가 다음 단계의 입력으로 그대로 전달된다.
const pipeline = chain(
  chain(readFileStep("input.txt"), (data) =>
    fetchStep(`https://api.example.com?data=${data}`)
  ),
  (response) => logStep(`fetched: ${response}`)
);

// 실행 결과에서 읽은 bytes가 URL에 들어가고, 그 응답 전체가 로그에 들어간 흐름을 확인할 수 있다.
console.log("합성한 pipeline 실행:");
pipeline.run();

// codeStep 406 — 파이프라인 타입에서 이펙트 목록 확인하기

// Effectful의 두 번째 타입 매개변수는 EffectTag로 제한되어 있다.
// 따라서 그 자리에서 추론하는 E에도 같은 제약을 밝혀, 유효한 이펙트 태그만 뽑히게 한다.
type PipelineEffects = typeof pipeline extends Effectful<unknown, infer E extends EffectTag>
  ? E
  : never;

// 첫 번째 상수는 파이프라인의 결과와 전체 이펙트를 함께 검사한다.
// 두 번째 상수는 그중 이펙트 목록만 뽑아도 정확히 세 태그인지 검사한다.
// 둘 다 true로 컴파일된다는 사실이, 구현을 읽지 않고 타입만으로 모든 이펙트를 안다는 증명이다.
const pipelineCarriesEveryEffect: Eq<
  typeof pipeline,
  Effectful<void, "fileIO" | "network" | "logging">
> = true;
const pipelineEffectsListIsComplete: Eq<
  PipelineEffects,
  "fileIO" | "network" | "logging"
> = true;

// 타입은 실행 전에 지워지므로 PipelineEffects 자체를 출력할 수는 없다.
// 이 메시지는 위 두 Eq 검사를 통과한 프로그램이 여기까지 실행되었음을 알려 준다.
console.log("타입 검사: pipeline에 fileIO, network, logging이 모두 기록되어 있습니다.");

export {};
