// 앞선 이펙트 추적과 합성을 Program에 모아, 실제 핸들러가 모두 붙어야 실행하게 한다.
// 실행: node episodes/s28-effect-tracking/missing-handler-error.ts
// 검사: npx tsc --noEmit

import {
  appendFile,
  readFile,
  writeFile,
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

  // codeStep 411 — run() 호출로 컴파일 에러 읽기

  // 명시적 this 매개변수는 E가 never인 프로그램만 호출 대상으로 허용한다.
  // 모든 태그에 핸들러를 붙인 뒤이므로, 실행 경계에서 완성된 Handlers로 단언한다.
  run(this: Program<A, never>): Promise<A> {
    return this.body(this.handlers as Handlers);
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

// network 하나가 남은 상태에서 run()을 부르면 무슨 일이 일어나는지 확인한다.
function tryRunWithNetworkUnhandled(): void {
  // Node의 타입 스트리핑은 타입 오류를 실행 중에 막지 않으므로, 이 함수는 정의만 하고 호출하지 않는다.
  // @ts-expect-error - network 이펙트가 아직 처리되지 않아 E가 never로 좁혀지지 않았다
  handled.run();
  // 실측 진단(@ts-expect-error 한 줄의 내용을 지우고 줄바꿈은 유지했을 때):
  // episodes/s28-effect-tracking/missing-handler-error.ts(119,3): error TS2684: The 'this' context of type 'Program<void, "network">' is not assignable to method's 'this' of type 'Program<void, never>'.
  //   Type '"network"' is not assignable to type 'never'.
}

// 핸들러를 하나도 붙이지 않으면 에러 메시지에 남은 세 태그가 함께 나타난다.
function tryRunWithNothingHandled(): void {
  // @ts-expect-error - 세 이펙트를 하나도 처리하지 않아 E가 never로 좁혀지지 않았다
  pipeline.run();
  // 실측 진단(@ts-expect-error 한 줄의 내용을 지우고 줄바꿈은 유지했을 때):
  // episodes/s28-effect-tracking/missing-handler-error.ts(128,3): error TS2684: The 'this' context of type 'Program<void, "fileIO" | "logging" | "network">' is not assignable to method's 'this' of type 'Program<void, never>'.
  //   Type '"fileIO" | "logging" | "network"' is not assignable to type 'never'.
  //     Type '"fileIO"' is not assignable to type 'never'.
}

// 두 @ts-expect-error는 오류가 실제로 나야만 통과한다. 거부 규칙이 그대로 지켜지는지가 계속 검사된다.
console.log("컴파일 에러 확인: 남은 이펙트가 있으면 run()을 호출할 수 없습니다.");

// 마지막 핸들러는 fetch로 실제 HTTP 요청을 수행하고, 응답 JSON을 리턴한다.
const complete = handled.handle("network", async (url) => {
  const response = await fetch(url);
  return response.json();
});

const completeHasNoRemainingEffects: Eq<
  typeof complete,
  Program<void, never>
> = true;

// 로그 파일을 비운 뒤, 세 핸들러를 사용하는 본문을 실행하고 실제 기록을 확인한다.
await writeFile(logPath, "");
await complete.run();
console.log("report.log 내용:");
console.log((await readFile(logPath, "utf8")).trimEnd());

export {};
