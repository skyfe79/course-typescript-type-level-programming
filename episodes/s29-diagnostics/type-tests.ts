// `@ts-expect-error`를 타입 단언으로 사용하는 타입 테스트 하네스다.
// 실행: node episodes/s29-diagnostics/type-tests.ts
// 검사: npx tsc --noEmit 또는 npm run test:types
// 런타임 테스트와 달리 이 파일은 컴파일된다는 사실 자체가 통과를 뜻한다.

// codeStep 418 — 실패해야 할 호출을 타입 단언으로 표시하기

// 화별 파일은 서로 import하지 않으므로, ep_189의 brand-error.ts에서 이 하네스의
// 검증에 필요한 TypeLevelError, Lookup, lookup만 최소한으로 다시 정의한다.
interface TypeLevelError<Message extends string, Detail = unknown> {
  // unique symbol 브랜드가 평범한 객체와 타입 레벨 에러를 구별한다.
  readonly __typeError: unique symbol;
  message: Message;
  detail: Detail;
}

// 키가 있으면 값의 타입을, 없으면 읽을 수 있는 실패 정보를 돌려준다.
type Lookup<T, K extends PropertyKey> =
  K extends keyof T ? T[K] : TypeLevelError<"KeyNotFound", K>;

function lookup<T extends object, K extends PropertyKey>(
  obj: T,
  key: K,
): Lookup<T, K> {
  if (key in obj) {
    // 런타임 검사는 키의 존재를 알지만 제네릭 조건부 타입의 분기까지 좁히지는 못한다.
    return obj[key as unknown as keyof T] as Lookup<T, K>;
  }

  // 브랜드는 타입에서만 필요하므로 런타임 객체에는 실패 정보만 담는다.
  return { message: "KeyNotFound", detail: key } as unknown as Lookup<T, K>;
}

const row = { id: 1, name: "ada" };

// 없는 키가 평범한 값 타입으로 흘러드는 회귀를 막는 단언이다.
// @ts-expect-error — "ghost"는 row에 없는 키라 Lookup이 string이 아니라 TypeLevelError를 돌려준다.
const missingKey: string = lookup(row, "ghost");
// 이 지시문은 원래 이 대입 자리에서 발생할 TS2322를 소비한다. 그 오류가 사라지면 TS2578이 난다.

// codeStep 420 — 서로 다른 실패 사례를 한 하네스에 모으기

// 있는 키의 값 타입이 정확히 보존되는지를 지키는 단언이다.
// @ts-expect-error — "name"은 있는 키지만 그 값은 string이라 number에 대입할 수 없다.
const wrongValueType: number = lookup(row, "name");

// 화별 파일은 서로 import하지 않으므로, ep_186의 missing-handler-error.ts에서 처리하지 않은
// 이펙트의 run() 호출을 검증하는 데 필요한 Program 구조만 최소한으로 다시 정의한다.
type EffectName = "readFile" | "writeLog" | "fetchUrl";

// A는 실행 결과이고, E는 아직 핸들러가 붙지 않은 이펙트 이름의 집합이다.
class Program<A, E extends EffectName> {
  // E가 실제 할당 가능성 검사에 참여하도록 남은 이펙트 집합을 타입에 싣는다.
  readonly remaining?: E;

  // erasableSyntaxOnly에 맞게 필드를 따로 선언하고 생성자 본문에서 대입한다.
  private readonly effects: readonly EffectName[];
  private readonly thunk: () => A;

  private constructor(
    effects: readonly EffectName[],
    thunk: () => A,
  ) {
    this.effects = effects;
    this.thunk = thunk;
  }

  static of<A>(
    effects: readonly EffectName[],
    thunk: () => A,
  ): Program<A, EffectName> {
    return new Program(effects, thunk);
  }

  handle<K extends E>(
    name: K,
    handler: () => void,
  ): Program<A, Exclude<E, K>> {
    // 이 하네스는 타입에서 이름이 제거되는지만 검사하므로 handler 본문은 실행하지 않는다.
    const remainingEffects = this.effects.filter((effect) => effect !== name);

    return new Program(remainingEffects, this.thunk) as Program<
      A,
      Exclude<E, K>
    >;
  }

  // 모든 이펙트가 처리되어 E가 never인 프로그램만 실행할 수 있다.
  run(this: Program<A, never>): A {
    return this.thunk();
  }
}

const handled = Program.of(
  ["readFile", "writeLog", "fetchUrl"],
  () => "report ready",
)
  .handle("readFile", () => {})
  .handle("writeLog", () => {});

function checkUnhandledEffect(): void {
  // 처리하지 않은 이펙트가 있는 프로그램의 실행을 막는 단언이다.
  // 함수는 호출하지 않는다. Node의 타입 스트리핑은 타입 오류를 런타임에 막지 않기 때문이다.
  // @ts-expect-error — fetchUrl 핸들러가 아직 붙지 않아 run()의 this 제약을 만족하지 못한다.
  handled.run();
}

// 새 실패 사례가 생기면 이 파일에 @ts-expect-error 단언을 한 줄씩 더해 하네스를 키운다.
console.log("타입 테스트 하네스가 컴파일되었습니다.");

// 이 파일의 타입 이름이 다른 화의 전역 선언과 섞이지 않도록 모듈 범위로 격리한다.
export {};
