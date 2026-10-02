// 앞선 이펙트 태그와 chain을 Program에 모아, 비동기 작업을 합성하는 예제다.
// 실행: node episodes/s28-effect-tracking/missing-handler-error.ts
// 검사: npx tsc --noEmit

import {
  appendFile,
  readFile,
} from "node:fs/promises";

// codeStep 409 — 여러 이펙트를 가진 프로그램 만들기

// 앞에서 사용한 세 이펙트 태그를 그대로 추적한다.
type EffectTag = "fileIO" | "network" | "logging";

type Post = { title: string };

// 각 핸들러는 실제 비동기 작업을 수행하고, 해당 단계의 결과를 리턴한다.
type Handlers = {
  fileIO: (path: string) => Promise<string>;
  network: (url: string) => Promise<Post>;
  logging: (message: string) => Promise<void>;
};

// A는 실행 결과이고, E는 아직 핸들러가 붙지 않은 이펙트 태그의 집합이다.
class Program<A, E extends EffectTag> {
  // 첫 예제의 Effectful처럼, effects라는 팬텀 필드로 E를 타입 구조에 남긴다.
  readonly effects?: E;

  // 필드를 따로 선언하고 생성자에서 대입하므로 erasableSyntaxOnly에서도 사용할 수 있다.
  private readonly handlers: Partial<Handlers>;
  private readonly body: (fx: Handlers) => Promise<A>;

  private constructor(
    handlers: Partial<Handlers>,
    body: (fx: Handlers) => Promise<A>,
  ) {
    this.handlers = handlers;
    this.body = body;
  }

  // 앞에서 본 세 단계처럼, 각 메서드는 자기 이펙트 태그 하나만 가진 프로그램을 리턴한다.
  // 지금은 작업을 수행하지 않고, 전달받을 핸들러를 호출하는 본문만 저장한다.
  static readFile(path: string): Program<string, "fileIO"> {
    return new Program({}, (fx) => fx.fileIO(path));
  }

  static fetch(url: string): Program<Post, "network"> {
    return new Program({}, (fx) => fx.network(url));
  }

  static log(message: string): Program<void, "logging"> {
    return new Program({}, (fx) => fx.logging(message));
  }

  // 앞에서 본 chain처럼 E | E2로 이펙트를 누적한다. 같은 logging은 중복되지 않는다.
  // 앞 단계의 비동기 결과를 기다린 뒤 다음 본문을 호출하며, 기존 핸들러도 보존한다.
  chain<B, E2 extends EffectTag>(
    next: (a: A) => Program<B, E2>,
  ): Program<B, E | E2> {
    return new Program(this.handlers, async (fx) => next(await this.body(fx)).body(fx));
  }

  // codeStep 410 — 핸들러를 하나만 빼고 붙이기

  // 앞 화의 discharge와 달리, 실제 핸들러 저장과 태그 제거를 같은 API 경계에서 수행한다.
  // K extends E는 남아 있는 태그만 허용하고, Exclude<E, K>는 그 태그를 타입에서 지운다.
  handle<K extends E>(tag: K, handler: Handlers[K]): Program<A, Exclude<E, K>> {
    return new Program({ ...this.handlers, [tag]: handler }, this.body) as Program<
      A,
      Exclude<E, K>
    >;
  }
}

// 두 타입이 정확히 같은지 판별한다. true를 상수에 대입하면 타입 주장이 계속 검사된다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

const logPath = "episodes/s28-effect-tracking/report.log";

// 파일 읽기, 로그 기록, HTTP 요청, 응답 로그 기록을 차례로 합성한다.
// 작업은 아직 수행하지 않으며, 각 단계의 결과와 이펙트가 다음 단계로 이어진다.
const pipeline = Program.readFile("package.json")
  .chain((text) => Program.log(`package.json: ${text.length}자`))
  .chain(() => Program.fetch("https://jsonplaceholder.typicode.com/posts/1"))
  .chain((post) => Program.log(`posts/1: ${post.title}`));

const pipelineCarriesEveryEffect: Eq<
  typeof pipeline,
  Program<void, EffectTag>
> = true;

// Eq 검사는 tsc가 맡고, 이 출력은 node가 이 지점까지 실행했음을 보여 준다.
console.log("타입 검사: pipeline에 fileIO, network, logging이 모두 기록되어 있습니다.");

// fileIO는 실제 파일 읽기에, logging은 실제 로그 파일 추가 기록에 연결한다.
// network 핸들러는 아직 붙이지 않았으므로, 타입에도 network 하나가 남는다.
const handled = pipeline
  .handle("fileIO", (path) => readFile(path, "utf8"))
  .handle("logging", (message) => appendFile(logPath, `${message}\n`));

const handledKeepsOnlyNetwork: Eq<
  typeof handled,
  Program<void, "network">
> = true;

export {};
