// 입력한 크기의 SVG를 내려받아 로컬에서 좌우 반전하고 저장한다. q를 입력하면 종료한다.
// 실행: printf '600\n400\nq\n' | node episodes/s28-effect-tracking/compose-program.ts
// 검사: npx tsc --noEmit

import {
  mkdir,
  writeFile,
} from "node:fs/promises";
import {
  createInterface,
} from "node:readline/promises";

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

// 단계 2 — 문제를 입력, 다운로드, 반전, 저장, 보고로 분해한다.

// 어느 입력에서든 q이면 quit을 리턴한다. 그 외에는 너비와 높이를 모은다.
const askSize: Program<Size | "quit", "input"> =
  Program.ask("너비> ").pipe((w) => {
    if (w === "q") return Program.of("quit" as const);
    return Program.ask("높이> ").pipe((h): Program<Size | "quit", never> => {
      if (h === "q") return Program.of("quit" as const);
      return Program.of({ w, h });
    });
  });

const askSizeEffects: Eq<
  typeof askSize, Program<Size | "quit", "input">
> = true;

// HTTP 실패도 태그로 기록하므로, 다운로드에는 두 이펙트가 필요하다.
function download({ w, h }: Size) {
  return Program.fetch(`https://placehold.co/${w}x${h}`).pipe((r) => {
    if (r.ok) return Program.of(r.text);
    return Program.fail(`placehold.co ${r.status}: ${w}x${h}`);
  });
}

const downloadEffects: Eq<
  ReturnType<typeof download>, Program<string, "network" | "failure">
> = true;

// 루트 svg는 보존하고 내부만 감싼다. 문자열 계산에는 핸들러가 필요하지 않다.
function flip(svg: string, { w }: Size): Program<string, never> {
  const group = `<g transform="translate(${w} 0) scale(-1 1)">`;
  return Program.of(svg.replace(
    /(<svg\b[^>]*>)([\s\S]*)(<\/svg>)/,
    (_, root, inner, end) => `${root}${group}${inner}</g>${end}`,
  ));
}

const flipIsPure: Eq<ReturnType<typeof flip>, Program<string, never>> = true;

// 저장 위치는 핸들러가 맡고, 이 프로그램은 파일 이름을 정한다.
function save(svg: string, { w, h }: Size) {
  return Program.writeFile(`placeholder-${w}x${h}-flipped.svg`, svg);
}

const saveEffects: Eq<ReturnType<typeof save>, Program<string, "fileIO">> = true;

// 저장 결과를 알리는 프로그램은 logging만 필요하다.
const report = (name: string) => Program.log(`저장: out/${name}`);

const reportEffects: Eq<ReturnType<typeof report>, Program<void, "logging">> = true;

console.log("분해: 작은 프로그램 다섯 개의 이펙트를 확인했습니다.");

// 단계 3 — 작은 프로그램을 한 작업으로 합성하고, 그 작업을 반복한다.

// 크기를 이미 받은 작업이므로 input은 없다. 앞 결과가 다음 프로그램의 입력이 된다.
const flipOnce = (s: Size) =>
  download(s)
    .pipe((svg) => flip(svg, s))
    .pipe((svg) => save(svg, s))
    .pipe(report);

const flipOnceEffects: Eq<
  ReturnType<typeof flipOnce>,
  Program<void, "network" | "failure" | "fileIO" | "logging">
> = true;

// 입력 프로그램과 이미지 작업을 합성한다. 반복 신호는 quit 또는 again이다.
const iteration = askSize.pipe((s) => {
  if (s === "quit") return Program.of("quit" as const);
  return flipOnce(s).pipe(() => Program.of("again" as const));
});

// quit까지 반복한다. HTTP 실패는 센티널로 현재 작업을 건너뛰고 입력을 계속 받는다.
const app = iteration.repeatUntil((r) => r === "quit");

const appEffects: Eq<typeof app, Program<void, EffectTag>> = true;
const loopKeepsEffects: Eq<
  typeof app["effects"], typeof iteration["effects"]
> = true;

console.log(
  "합성: app에 input, network, fileIO, logging, failure가 모두 기록되어 있습니다.",
);

// 단계 4 — 다섯 핸들러를 연결하여 합성한 앱을 실행한다.

// 첫 입력 때 단일 iterator를 만든다. 파이프 입력도 줄을 잃지 않고 순서대로 읽는다.
let rl: ReturnType<typeof createInterface> | undefined;
let lines: AsyncIterator<string> | undefined;

// 작업 디렉터리가 달라도 이 파일 옆의 out에 저장한다.
const dir = new URL("./out/", import.meta.url);

// 프로그램은 작업 순서를 정하고, 핸들러는 실제 입력과 외부 작업을 수행한다.
const complete = app
  .handle("input", async (prompt) => {
    if (!lines) {
      rl = createInterface({ input: process.stdin });
      lines = rl[Symbol.asyncIterator]();
    }
    process.stdout.write(prompt);
    const line = await lines.next();
    const value = line.done ? "q" : line.value;
    if (!process.stdin.isTTY) console.log(value);
    return value;
  })
  .handle("network", async (url) => {
    const r = await fetch(url);
    return { ok: r.ok, status: r.status, text: await r.text() };
  })
  .handle("fileIO", async (name, svg) => {
    await mkdir(dir, { recursive: true });
    await writeFile(new URL(name, dir), svg);
  })
  .handle("logging", async (message) => {
    console.log(message);
  })
  .handle("failure", async (reason) => {
    console.log(`실패: ${reason}`);
  });

// 모든 태그가 제거되어 실행 가능한 Program<void, never>가 된다.
const completeEffects: Eq<typeof complete, Program<void, never>> = true;

// 반복이 끝나거나 예외가 나면 입력 인터페이스를 닫는다.
try {
  await complete.run();
} finally {
  rl?.close();
}

export {};
