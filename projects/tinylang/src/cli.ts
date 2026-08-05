// tinylang 명령행 인자를 판별 유니온으로 바꾸고, 파일과 프로세스를 다루는 효과를
// 이 경계 한곳에 모은다. 컴파일러 본체는 문자열과 값만 주고받는 순수 함수로 남는다.

import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { Program } from "./ast.ts";
import { compile, formatDiagnostic } from "./compile.ts";
import { emitProgram } from "./emitter.ts";

export type Command = "check" | "build" | "run";

export type ParsedArgs =
  | { readonly kind: Command; readonly path: string; readonly outPath: string | null }
  | { readonly kind: "usage"; readonly reason: string | null };

export const CLI_USAGE = `사용법:
  tinylang check <소스.tl>
  tinylang build <소스.tl> [-o <출력.js>]
  tinylang run <소스.tl> [-o <출력.js>]

명령:
  check  소스의 오류를 검사합니다
  build  소스를 자바스크립트 파일로 만듭니다
  run    소스를 실행합니다

옵션:
  -o <출력.js>  build 또는 run의 출력 파일을 지정합니다`;

// 명령행에서 받은 string을 닫힌 Command 유니온으로 좁혀, 이후 분기가 새 명령의 추가를 추적하게 한다.
function isCommand(value: string): value is Command {
  return value === "check" || value === "build" || value === "run";
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const command = argv[0];
  if (command === undefined) {
    // 인자를 생략한 호출은 오류 이유 없이 사용법만 보여 주는 정상적인 도움말 요청으로 본다.
    return { kind: "usage", reason: null };
  }

  if (!isCommand(command)) {
    return { kind: "usage", reason: `알 수 없는 명령 '${command}'입니다` };
  }

  const path = argv[1];
  if (path === undefined || path === "" || path === "-o") {
    return { kind: "usage", reason: `${command} 명령에는 소스 경로가 필요합니다` };
  }

  const remaining = argv.slice(2);
  // check는 출력물을 만들지 않는다. 값이 빠진 -o라도 먼저 이 조합 자체가 잘못됐음을 알려 준다.
  if (command === "check" && remaining.includes("-o")) {
    return {
      kind: "usage",
      reason: "check는 출력 파일을 만들지 않으므로 -o와 함께 쓸 수 없습니다",
    };
  }

  let outPath: string | null = null;
  let index = 0;

  while (index < remaining.length) {
    const token = remaining[index];
    if (token !== "-o") {
      // 남는 인자를 무시하면 오타가 성공한 호출처럼 보여, 사용자가 원인을 찾기 어렵다.
      return { kind: "usage", reason: `예상하지 못한 인자 '${token}'입니다` };
    }

    if (outPath !== null) {
      return { kind: "usage", reason: "-o는 한 번만 사용할 수 있습니다" };
    }

    const value = remaining[index + 1];
    if (value === undefined || value === "" || value === "-o") {
      return { kind: "usage", reason: "-o 뒤에 출력 경로가 필요합니다" };
    }

    outPath = value;
    index += 2;
  }

  return { kind: command, path, outPath };
}

type ProgramOutcome =
  | { readonly ok: true; readonly program: Program }
  | { readonly ok: false; readonly code: number };

// Error가 아닌 값도 던질 수 있는 자바스크립트 경계에서 원인을 안전하게 한 줄로 바꾼다.
function describeCause(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// 세 명령이 똑같은 읽기·컴파일·진단 출력 규칙을 거치게 해, 한 명령만 오류를
// 다르게 처리하는 일을 막는다. 성공한 뒤에만 AST를 다음 효과 단계로 넘긴다.
function loadProgram(path: string): ProgramOutcome {
  let source: string;

  try {
    source = readFileSync(path, "utf8");
  } catch (error) {
    console.error(`소스 파일을 읽을 수 없습니다: ${path} (${describeCause(error)})`);
    return { ok: false, code: 1 };
  }

  const result = compile(source);
  if (!result.ok) {
    for (const diagnostic of result.diagnostics) {
      console.error(formatDiagnostic(diagnostic));
    }
    return { ok: false, code: 1 };
  }

  return { ok: true, program: result.program };
}

function defaultOutputPath(path: string): string {
  // 마지막 .tl만 .js로 바꾸고, 다른 확장자나 확장자가 없는 이름에는 .js를 덧붙인다.
  return path.endsWith(".tl") ? `${path.slice(0, -3)}.js` : `${path}.js`;
}

function runCheck(path: string): number {
  const loaded = loadProgram(path);
  if (!loaded.ok) return loaded.code;

  console.log(`${path}: 오류 없음`);
  return 0;
}

type BuildOutcome =
  | { readonly ok: true; readonly outPath: string }
  | { readonly ok: false; readonly code: number };

function runBuild(path: string, outPath: string | null): BuildOutcome {
  const target = outPath ?? defaultOutputPath(path);

  // 표기가 달라도 같은 절대 경로를 가리킬 수 있다. 디스크를 건드리기 전에 정규화한
  // 경로를 비교해, 컴파일 결과가 원본 소스를 덮어쓰는 일을 막는다.
  if (resolve(path) === resolve(target)) {
    console.error(`출력 경로가 소스 경로와 같아 덮어쓸 수 없습니다: ${target}`);
    return { ok: false, code: 1 };
  }

  const loaded = loadProgram(path);
  if (!loaded.ok) return loaded;

  const targetDirectory = dirname(target);
  const preludeJavaScriptSource = join(import.meta.dirname, "prelude.js");
  const preludeTypeScriptSource = join(import.meta.dirname, "prelude.ts");
  const preludeJavaScriptTarget = join(targetDirectory, "prelude.js");
  const preludeTypeScriptTarget = join(targetDirectory, "prelude.ts");

  try {
    mkdirSync(targetDirectory, { recursive: true });
    writeFileSync(target, emitProgram(loaded.program), "utf8");

    // 생성 코드의 ./prelude.js는 다리 파일이고, 그 다리는 다시 실제 prelude.ts를
    // 가리킨다. Node가 두 상대 경로를 모두 찾도록 출력 파일 옆에 함께 복사한다.
    if (resolve(preludeJavaScriptSource) !== resolve(preludeJavaScriptTarget)) {
      copyFileSync(preludeJavaScriptSource, preludeJavaScriptTarget);
    }
    if (resolve(preludeTypeScriptSource) !== resolve(preludeTypeScriptTarget)) {
      copyFileSync(preludeTypeScriptSource, preludeTypeScriptTarget);
    }
  } catch (error) {
    console.error(`출력 파일을 만들 수 없습니다: ${target} (${describeCause(error)})`);
    return { ok: false, code: 1 };
  }

  // build와 run이 같은 함수를 쓰므로 여기서는 성공 메시지를 내지 않는다.
  // build 명령만 dispatch에서 경로를 알리고, run은 프로그램 출력만 그대로 보인다.
  return { ok: true, outPath: target };
}

function runRun(path: string, outPath: string | null): number {
  const built = runBuild(path, outPath);
  if (!built.ok) return built.code;

  // 부모의 표준 입출력을 그대로 물려줘야 동기 input이 터미널이나 파이프에서 직접 읽고,
  // 생성 프로그램의 출력도 중간 버퍼 없이 사용자가 보는 표준 출력으로 이어진다.
  const result = spawnSync(process.execPath, [built.outPath], { stdio: "inherit" });

  if (result.error !== undefined) {
    console.error(`생성한 프로그램을 실행할 수 없습니다: ${describeCause(result.error)}`);
    return 1;
  }

  if (result.status === null) {
    const signal = result.signal ?? "알 수 없는 시그널";
    console.error(`생성한 프로그램이 종료 코드 없이 끝났습니다: ${signal}`);
    return 1;
  }

  // 실행한 프로그램의 성공과 실패를 감추지 않고 CLI 자체의 종료 코드로 그대로 전달한다.
  return result.status;
}

export function dispatch(args: ParsedArgs): number {
  switch (args.kind) {
    case "check":
      return runCheck(args.path);
    case "build": {
      const built = runBuild(args.path, args.outPath);
      if (!built.ok) return built.code;
      console.log(`자바스크립트 파일을 만들었습니다: ${built.outPath}`);
      return 0;
    }
    case "run":
      return runRun(args.path, args.outPath);
    case "usage":
      if (args.reason !== null) {
        console.error(args.reason);
      }
      console.error(CLI_USAGE);
      return 1;
    default: {
      const exhaustive: never = args;
      return exhaustive;
    }
  }
}

function main(): void {
  // 즉시 종료하지 않고 코드만 정하면, 아직 비워지지 않은 표준 출력과 오류 출력이 끝까지 전달된다.
  process.exitCode = dispatch(parseArgs(process.argv.slice(2)));
}

// 이 파일은 CLI 진입점이면서, 관찰 스크립트가 parseArgs를 가져다 쓰는 모듈이기도 하다.
// node가 직접 실행한 파일일 때만 main을 부르면 import만 한 쪽에서는 인자를 읽지 않는다.
if (process.argv[1] === import.meta.filename) {
  main();
}
