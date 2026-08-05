// 결과 타입에 이펙트 태그 유니온을 붙여, 프로그램이 수행할 일을 타입만으로 드러낸다.
// 실행: node episodes/s28-effect-tracking/effect-type-parameter.ts
// 검사: npx tsc --noEmit

// codeStep 400 — 결과 타입 옆에 이펙트 유니온 붙이기

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

// 편집기 호버에 기대지 않고, 두 함수의 반환 타입을 컴파일러가 계속 검사하게 한다.
const readConfigReturnsFileIO: Eq<
  ReturnType<typeof readConfig>,
  Effectful<string, "fileIO">
> = true;
const writeLogReturnsLogging: Eq<
  ReturnType<typeof writeLog>,
  Effectful<void, "logging">
> = true;

// 팬텀 필드는 타입 검사에만 쓰인다. readConfig가 만든 런타임 객체에는 effects 키가 없다.
const configProgram = readConfig("app.json");
console.log("readConfig 결과에 effects 키가 있는가:", "effects" in configProgram);

export {};
