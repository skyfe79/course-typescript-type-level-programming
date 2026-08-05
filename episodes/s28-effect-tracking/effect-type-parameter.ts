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

// codeStep 401 — 이펙트가 다른 두 프로그램 구분하기

// 파일만 읽는 프로그램은 readConfig의 fileIO 이펙트를 그대로 가진다.
function loadOnly(path: string): Effectful<string, "fileIO"> {
  return readConfig(path);
}

// 파일을 읽고 로그도 남기므로, 두 이펙트 태그를 유니온으로 함께 기록한다.
function loadAndLog(path: string): Effectful<string, "fileIO" | "logging"> {
  const config = readConfig(path);
  const log = writeLog(`loaded ${path}`);

  // 두 이펙트 값 모두 run() 전까지 실행을 미뤘다가, 합성된 프로그램을 실행할 때 차례로 수행한다.
  return {
    run: () => {
      const result = config.run();
      log.run();
      return result;
    },
  };
}

// fileIO만 수행하는 프로그램은 같은 이펙트 타입의 자리에 정상적으로 대입된다.
const ok: Effectful<string, "fileIO"> = loadOnly("app.json");

function tryAssignLoadAndLogToFileIOOnly(): void {
  // Node의 타입 스트리핑은 타입 오류를 실행 중에 막지 않으므로, 이 함수는 정의만 하고 호출하지 않는다.
  // @ts-expect-error - loadAndLog는 logging 이펙트를 더 수행하므로 fileIO만 허용하는 자리에 들어갈 수 없다
  const mismatch: Effectful<string, "fileIO"> = loadAndLog("app.json");
  // 실측 진단(@ts-expect-error 한 줄만 제거했을 때):
  // episodes/s28-effect-tracking/effect-type-parameter.ts(71,9): error TS2322: Type 'Effectful<string, "fileIO" | "logging">' is not assignable to type 'Effectful<string, "fileIO">'.
  //   Type '"fileIO" | "logging"' is not assignable to type '"fileIO"'.
  //     Type '"logging"' is not assignable to type '"fileIO"'.
}

// 두 프로그램을 실제로 실행한다. 두 번째 경로에서만 loaded 로그가 한 줄 더 출력된다.
console.log("loadOnly run():", ok.run());
console.log("loadAndLog run():", loadAndLog("app.json").run());

export {};
