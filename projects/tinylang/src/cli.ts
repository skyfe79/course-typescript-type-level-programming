// tinylang 명령행 인자를 판별 유니온으로 바꾸고, 실행할 명령을 고르는 경계다.
// 이번 단계는 파일을 읽지 않는다. 파싱 결과를 값으로 남겨 다음 단계의 실제 작업과 분리한다.

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

export function dispatch(args: ParsedArgs): number {
  switch (args.kind) {
    case "check":
      // codeStep 481에서 채운다
      console.log(`check 대상: ${args.path}`);
      return 0;
    case "build":
      // codeStep 481에서 채운다
      console.log(`build 대상: ${args.path}`);
      return 0;
    case "run":
      // codeStep 481에서 채운다
      console.log(`run 대상: ${args.path}`);
      return 0;
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
