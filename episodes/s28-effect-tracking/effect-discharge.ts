// 처리한 이펙트를 하나씩 지워, 프로그램 타입에 아직 남은 이펙트만 기록한다.
// 실행: node episodes/s28-effect-tracking/effect-discharge.ts
// 검사: npx tsc --noEmit

// codeStep 407 — 핸들러 하나로 이펙트 하나 지우기

// 이 강좌에서 추적할 수 있는 부수 효과의 이름을 하나의 유니온으로 모은다.
type EffectTag = "fileIO" | "network" | "logging";

// Result는 프로그램을 실행한 결과이고, Effects는 실행 중 일어날 부수 효과다.
// effects는 팬텀 필드라서 런타임 객체에 넣지 않아도 되지만, 타입에는 Effects를 보존한다.
interface Effectful<Result, Effects extends EffectTag> {
  readonly effects?: Effects;
  run(
    this: [Effects] extends [never] ? Effectful<Result, Effects> : never
  ): Result;
}

// 두 타입이 정확히 같은지 판별한다. true를 상수에 대입하면 타입 주장이 계속 검사된다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// 앞 화에서 만든 합성 도구다. 각 단계의 이펙트를 EA와 EB로 따로 추론한 뒤 유니온으로 합친다.
function chain<A, B, EA extends EffectTag, EB extends EffectTag>(
  step: Effectful<A, EA>,
  next: (a: A) => Effectful<B, EB>
): Effectful<B, EA | EB> {
  return {
    run: () => {
      // 합성기 내부에서는 아직 이펙트가 남은 프로그램을 실제로 실행해야 한다.
      // 바깥 API(run의 this 제약)는 그대로 두고, 이 자리에서만 실행 가능한 형태로 좁혀 본다.
      const first = step as Effectful<A, never>;
      const second = next(first.run()) as Effectful<B, never>;
      return second.run();
    },
  };
}

// 세 함수는 합성할 파이프라인의 재료다.
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

// 안쪽 chain은 파일 읽기와 네트워크 요청을 잇고, 바깥 chain은 그 결과에 로깅을 잇는다.
// 그 결과 pipeline에는 세 단계가 수행할 이펙트가 모두 유니온으로 기록된다.
const pipeline = chain(
  chain(readFileStep("input.txt"), (data) =>
    fetchStep(`https://api.example.com?data=${data}`)
  ),
  (response) => logStep(`fetched: ${response}`)
);

// discharge는 런타임 프로그램을 바꾸는 실행기가 아니라, Handled가 처리되었다는 사실을
// 타입에 반영하는 경계다. Handled extends Effects이므로 실제로 남아 있는 태그만 지울 수 있다.
function discharge<Result, Effects extends EffectTag, Handled extends Effects>(
  program: Effectful<Result, Effects>,
  _handled: Handled
): Effectful<Result, Exclude<Effects, Handled>> {
  return program as Effectful<Result, Exclude<Effects, Handled>>;
}

// logging을 처리했다고 표시하면 그 태그 하나만 빠지고 나머지 두 태그는 그대로 남는다.
// 원본 pipeline 값의 타입은 바뀌지 않으므로, 아래 두 Eq를 나란히 놓아 차이를 확인한다.
const afterLogging = discharge(pipeline, "logging");
const afterLoggingKeepsOnlyUnhandledEffects: Eq<
  typeof afterLogging,
  Effectful<void, "fileIO" | "network">
> = true;
const originalPipelineStillCarriesEveryEffect: Eq<
  typeof pipeline,
  Effectful<void, "fileIO" | "network" | "logging">
> = true;

// 아직 이펙트가 남은 프로그램은 실행하지 않는다. 이 단계의 확인은 위 두 Eq 상수가 맡고,
// 여기서는 그 검사를 통과했다는 사실을 메시지로만 알린다.
console.log("타입 검사: afterLogging에는 fileIO와 network만 남아 있습니다.");
console.log("타입 검사: 원본 pipeline에는 세 이펙트가 모두 남아 있습니다.");

// codeStep 408 — run()이 남은 이펙트를 거부하게 만들기

// Effects를 튜플로 감싼 조건부 타입은 유니온의 각 태그로 조건이 분산되는 것을 막는다.
// 따라서 Effects 전체가 never일 때만 run의 this가 호출 가능한 Effectful 타입이 된다.
// pipeline.run(); // 컴파일 에러 — fileIO, network, logging 이펙트가 아직 남아 있다.

// 한 번의 discharge는 한 태그만 지운다. 세 태그를 차례로 처리하고 나면
// Effects가 never가 되어, 외부에서도 run을 안전하게 호출할 수 있는 프로그램이 된다.
const handled = discharge(
  discharge(discharge(pipeline, "fileIO"), "network"),
  "logging"
);
const handledHasNoRemainingEffects: Eq<
  typeof handled,
  Effectful<void, never>
> = true;

// handled는 pipeline과 같은 런타임 프로그램이므로, 실제 실행 결과도 앞 화의 파이프라인과 같다.
console.log("모든 이펙트를 처리한 pipeline 실행:");
handled.run();

export {};
