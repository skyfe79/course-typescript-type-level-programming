// 작은 프로그램을 합성할 Program 도구와 이펙트 타입을 정의한다.
// 실행: printf '600\n400\nq\n' | node episodes/s28-effect-tracking/compose-program.ts
// 검사: npx tsc --noEmit

// 단계 1 — 작은 프로그램을 합성할 도구를 준비한다.

// 입력과 실패도 다른 작업처럼 이펙트 태그로 추적한다.
type EffectTag = "input" | "network" | "fileIO" | "logging" | "failure";
type Size = { w: string; h: string };
type ResponseText = { ok: boolean; status: number; text: string };

// 각 핸들러는 실제 작업을 수행하고 해당 작업의 결과를 리턴한다.
type Handlers = {
  input: (prompt: string) => Promise<string>;
  network: (url: string) => Promise<ResponseText>;
  fileIO: (name: string, svg: string) => Promise<void>;
  logging: (message: string) => Promise<void>;
  failure: (reason: string) => Promise<void>;
};

// 반복기는 이 모듈의 센티널만 잡고, 다른 예외는 전파한다.
const skipped = Symbol("iteration failed");

// A는 실행 결과이고, E는 아직 처리하지 않은 이펙트 태그이다.
class Program<A, E extends EffectTag> {
  // 팬텀 필드는 아직 처리하지 않은 E를 타입 구조에 보존한다.
  readonly effects?: E;

  // 필드를 따로 선언하고 대입하여 erasableSyntaxOnly에서도 사용할 수 있게 한다.
  private readonly handlers: Partial<Handlers>;
  private readonly body: (fx: Handlers) => Promise<A>;

  private constructor(
    handlers: Partial<Handlers>,
    body: (fx: Handlers) => Promise<A>,
  ) {
    this.handlers = handlers;
    this.body = body;
  }

  // 생성자는 작업을 수행하지 않고, 나중에 핸들러를 호출할 본문만 저장한다.
  static ask(prompt: string): Program<string, "input"> {
    return new Program({}, (fx) => fx.input(prompt));
  }

  static fetch(url: string): Program<ResponseText, "network"> {
    return new Program({}, (fx) => fx.network(url));
  }

  static writeFile(name: string, svg: string): Program<string, "fileIO"> {
    return new Program({}, async (fx) => {
      await fx.fileIO(name, svg);
      return name;
    });
  }

  static log(message: string): Program<void, "logging"> {
    return new Program({}, (fx) => fx.logging(message));
  }

  // 순수한 값은 이펙트를 추가하지 않는다.
  static of<T>(value: T): Program<T, never> {
    return new Program({}, async () => value);
  }

  // 실패를 보고한 뒤 현재 반복만 중단한다.
  static fail(reason: string): Program<never, "failure"> {
    return new Program({}, async (fx) => {
      await fx.failure(reason);
      throw skipped;
    });
  }

  // 앞 결과를 다음 프로그램에 넘기며, 두 프로그램의 이펙트를 E | E2로 모은다.
  pipe<B, E2 extends EffectTag>(
    next: (a: A) => Program<B, E2>,
  ): Program<B, E | E2> {
    return new Program(this.handlers, async (fx) => {
      return next(await this.body(fx)).body(fx);
    });
  }

  // 같은 본문을 반복하므로 E가 늘지 않는다. 종료 값은 판별 함수로 정한다.
  repeatUntil(done: (a: A) => boolean): Program<void, E> {
    return new Program(this.handlers, async (fx) => {
      while (true) {
        try {
          if (done(await this.body(fx))) return;
        } catch (error) {
          if (error !== skipped) throw error;
        }
      }
    });
  }

  // 핸들러를 실제로 저장하고, 남은 태그 K를 Exclude로 제거한다.
  handle<K extends E>(tag: K, handler: Handlers[K]): Program<A, Exclude<E, K>> {
    return new Program({ ...this.handlers, [tag]: handler }, this.body);
  }

  // this 제약은 E가 never일 때만 실행을 허용한다. 완성된 표를 본문에 전달한다.
  run(this: Program<A, never>): Promise<A> {
    return this.body(this.handlers as Handlers);
  }
}

// 두 타입이 정확히 같은지 판별한다.
type Eq<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false;

console.log("준비: Program 도구가 준비되었습니다.");

export {};
