// 처리하지 않은 이펙트가 남으면 run() 호출을 컴파일 단계에서 거부하는 예제다.
// 실행: node episodes/s28-effect-tracking/missing-handler-error.ts
// 검사: npx tsc --noEmit

// codeStep 409 — 여러 이펙트를 가진 프로그램 만들기

// 이 예제에서 프로그램이 수행할 수 있는 부수 효과의 이름을 하나의 유니온으로 모은다.
type EffectName = "readFile" | "writeLog" | "fetchUrl";

// A는 실행 결과이고, E는 아직 핸들러가 붙지 않은 이펙트 이름의 집합이다.
class Program<A, E extends EffectName> {
  // 런타임 값은 담기지 않지만, 아직 처리되지 않은 이펙트 집합을 타입에 싣는다.
  readonly remaining?: E;

  // erasableSyntaxOnly에서도 컴파일되도록 필드를 따로 선언하고 생성자 본문에서 대입한다.
  private readonly effects: readonly EffectName[];
  private readonly thunk: () => A;

  private constructor(
    effects: readonly EffectName[],
    thunk: () => A,
  ) {
    this.effects = effects;
    this.thunk = thunk;
  }

  // 반환 타입에 EffectName 별칭 대신 세 이름을 그대로 적는다. 별칭으로 적으면 호버와 에러
  // 메시지에 EffectName이라는 이름만 뜨고, 어떤 이펙트가 남았는지가 화면에서 보이지 않는다.
  static of<A>(
    effects: readonly EffectName[],
    thunk: () => A,
  ): Program<A, "readFile" | "writeLog" | "fetchUrl"> {
    return new Program(effects, thunk);
  }

  // codeStep 410 — 핸들러를 하나만 빼고 붙이기

  // K는 현재 E에 남아 있는 이름만 받을 수 있고, 반환 타입에서는 그 이름 하나를 제거한다.
  handle<K extends E>(
    name: K,
    handler: () => void,
  ): Program<A, Exclude<E, K>> {
    // 이 예제가 보려는 것은 이름이 타입에서 지워지는 과정뿐이라, handler 본문은 실행하지 않는다.
    // 처리한 이름을 런타임 목록에서 빼고, 같은 사실을 Exclude<E, K>로 타입에도 반영한다.
    const remainingEffects = this.effects.filter((effect) => effect !== name);

    return new Program(remainingEffects, this.thunk) as Program<
      A,
      Exclude<E, K>
    >;
  }

  // codeStep 411 — run() 호출로 컴파일 에러 읽기

  // 다형 this 매개변수다. E가 never로 좁혀진 Program만 this 자리에 들어올 수 있으므로,
  // 아직 처리되지 않은 이펙트가 하나라도 남아 있으면 호출 자체가 거부된다.
  run(this: Program<A, never>): A {
    return this.thunk();
  }
}

// 두 타입이 정확히 같은지 판별한다. true를 상수에 대입하면 타입 주장이 계속 검사된다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// 세 이펙트를 모두 수행할 수 있으며, 실제 결과 계산은 run() 전까지 thunk로 미룬다.
const report = Program.of<string>(
  ["readFile", "writeLog", "fetchUrl"],
  () => "report ready",
);

const reportCarriesEveryEffect: Eq<
  typeof report,
  Program<string, EffectName>
> = true;

// 타입은 실행 전에 지워지므로, Eq 검사를 통과한 프로그램이 여기까지 왔음을 알린다.
console.log("타입 검사: report에 세 이펙트가 모두 기록되어 있습니다.");

// readFile과 writeLog만 처리하고, fetchUrl은 컴파일 에러를 확인하려고 일부러 남겨 둔다.
const handled = report
  .handle("readFile", () => console.log("파일 읽기 처리"))
  .handle("writeLog", () => console.log("로그 기록 처리"));

const handledKeepsOnlyFetchUrl: Eq<
  typeof handled,
  Program<string, "fetchUrl">
> = true;

// fetchUrl 하나가 남은 상태에서 run()을 부르면 무슨 일이 일어나는지 확인한다.
function tryRunWithFetchUrlUnhandled(): void {
  // Node의 타입 스트리핑은 타입 오류를 실행 중에 막지 않으므로, 이 함수는 정의만 하고 호출하지 않는다.
  // @ts-expect-error - fetchUrl 이펙트가 아직 처리되지 않아 E가 never로 좁혀지지 않았다
  handled.run();
  // 실측 진단(@ts-expect-error 한 줄만 제거했을 때):
  // episodes/s28-effect-tracking/missing-handler-error.ts(92,3): error TS2684: The 'this' context of type 'Program<string, "fetchUrl">' is not assignable to method's 'this' of type 'Program<string, never>'.
  //   Type '"fetchUrl"' is not assignable to type 'never'.
}

// 핸들러를 하나도 붙이지 않으면 에러 메시지에 남은 세 이름이 함께 나타난다.
function tryRunWithNothingHandled(): void {
  // @ts-expect-error - 세 이펙트를 하나도 처리하지 않아 E가 never로 좁혀지지 않았다
  report.run();
  // 실측 진단(@ts-expect-error 한 줄만 제거했을 때):
  // episodes/s28-effect-tracking/missing-handler-error.ts(101,3): error TS2684: The 'this' context of type 'Program<string, "fetchUrl" | "readFile" | "writeLog">' is not assignable to method's 'this' of type 'Program<string, never>'.
  //   Type '"fetchUrl" | "readFile" | "writeLog"' is not assignable to type 'never'.
  //     Type '"fetchUrl"' is not assignable to type 'never'.
}

// 두 @ts-expect-error는 오류가 실제로 나야만 통과한다. 거부 규칙이 그대로 지켜지는지가 계속 검사된다.
console.log("컴파일 에러 확인: 남은 이펙트가 있으면 run()을 호출할 수 없습니다.");

export {};
