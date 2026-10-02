// 이펙트 태그는 아직 핸들러가 붙지 않은 작업을 나타낸다.
export type EffectTag = "input" | "network" | "fileIO" | "logging";

export type Handlers = {
  input: (prompt: string) => Promise<string>;
  network: (url: string) => Promise<
    Pick<Response, "ok" | "status" | "text" | "arrayBuffer">
  >;
  fileIO: (name: string, data: string | Uint8Array) => Promise<string>;
  logging: (message: string) => Promise<void>;
};

// In은 입력, Out은 결과, Err는 오류, Fx는 아직 처리하지 않은 이펙트이다.
export abstract class Program<In, Out, Err, Fx extends EffectTag> {
  readonly effects?: Fx;
  readonly errors?: Err;
  private readonly handlers: Partial<Handlers>;
  protected abstract readonly body: (input: In, fx: Handlers) => Promise<Out>;

  protected constructor(handlers: Partial<Handlers> = {}) {
    this.handlers = handlers;
  }

  // 오퍼레이터도 같은 Program으로 만들며, 생성 시점에는 본문을 실행하지 않는다.
  static create<I, O, Err, Fx extends EffectTag>(
    body: (input: I, fx: Handlers) => Promise<O>,
  ): Program<I, O, Err, Fx> {
    return new BodyProgram(body);
  }

  // 자식의 핸들러를 나중에 펼치므로 가장 가까운 핸들러가 우선한다.
  execute(input: In, outerFx: Handlers): Promise<Out> {
    return this.body(input, { ...outerFx, ...this.handlers });
  }

  // 새 프로그램에 핸들러를 저장하고, 해당 태그만 타입에서 제거한다.
  handle<K extends Fx>(
    tag: K,
    handler: Handlers[K],
  ): Program<In, Out, Err, Exclude<Fx, K>> {
    return new BodyProgram(
      (input, fx) => this.body(input, fx),
      { ...this.handlers, [tag]: handler },
    );
  }

  // 선언한 Err에 속하는 값만 명시적인 실패로 던진다.
  protected fail(error: Err): never {
    throw error;
  }

  // 오류와 이펙트가 모두 처리되어야 실행한다. void 입력은 생략할 수 있다.
  run(this: Program<In, Out, never, never>, input: In): Promise<Out> {
    return this.execute(input, {} as Handlers);
  }
}

// 핸들러를 붙이거나 오퍼레이터를 만들 때 본문을 보존하는 내부 클래스이다.
class BodyProgram<In, Out, Err, Fx extends EffectTag>
  extends Program<In, Out, Err, Fx> {
  protected readonly body: (input: In, fx: Handlers) => Promise<Out>;

  constructor(
    body: (input: In, fx: Handlers) => Promise<Out>,
    handlers: Partial<Handlers> = {},
  ) {
    super(handlers);
    this.body = body;
  }
}

// 두 타입이 정확히 같은지 판별하고, 팬텀 필드에서 남은 이펙트와 오류를 읽는다.
export type Eq<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false;

export type Remaining<P extends { readonly effects?: EffectTag }> =
  Exclude<P["effects"], undefined>;

export type RemainingErrors<P extends { readonly errors?: unknown }> =
  Exclude<P["errors"], undefined>;
