#!/usr/bin/env node
/*
 * imgfx의 명령행 표면입니다. package.json의 bin이 빌드 결과 dist/cli.js를 imgfx라는 이름으로
 * 가리키므로, 이 파일은 라이브러리가 아니라 실행 파일의 진입점입니다.
 *
 * 첫 줄의 셔뱅이 있어야 npm이 bin으로 연결한 이름을 셸이 직접 실행할 수 있습니다. bin 필드는
 * 어떤 파일인지만 정하고, 그 파일을 무엇으로 실행할지는 셔뱅이 정합니다. tsc는 이 줄을 그대로
 * dist/cli.js로 옮깁니다.
 *
 * 그래서 여기의 어떤 함수도 export하지 않습니다. 명령행 인자를 스테이지로 바꾸는 파서와
 * 스펙 테이블은 이 실행 파일의 사정이지, 패키지를 import 하는 쪽이 의존할 계약이 아닙니다.
 * 공개 계약은 src/index.ts가 정합니다.
 *
 * 실행 위치와 명령:
 *   cd projects/imgfx
 *   node src/cli.ts apply photo.png --saturate 0 --blur 3 -o out.png   (소스 그대로)
 *   node dist/cli.js apply photo.png --saturate 0 --blur 3 -o out.png  (빌드 결과)
 */
import { PNG } from "pngjs";
import { readFileSync, writeFileSync } from "node:fs";
import {
  boxBlurStage,
  brightnessStage,
  contrastStage,
  decodeCount,
  encodeCount,
  flipStage,
  gaussianBlurStage,
  grayscaleStage,
  invertStage,
  planPipeline,
  resetPipelineCounts,
  rotateStage,
  runPipeline,
  saturateStage,
  sharpenStage,
  thresholdStage,
} from "./imgfx.ts";
import type {
  Direction,
  EdgePolicy,
  ExecutableStage,
  Rotation,
} from "./imgfx.ts";
// -----------------------------------------------------------------------------
// codeStep 452 — 명령줄 플래그를 실행 가능한 스테이지로 바꾸는 CLI 경계
// -----------------------------------------------------------------------------

// codeStep 452 — 각 플래그는 뒤에서 소비할 인자 수와 스테이지 생성법을 한곳에 묶는다.
// 테이블을 읽는 쪽은 개별 플래그의 사정을 알 필요 없이 arity만큼 이동하면 된다.
interface FlagSpec {
  readonly arity: number;
  readonly build: (args: readonly string[]) => ExecutableStage;
}

// codeStep 452 — 명령줄의 숫자는 Number가 NaN이나 Infinity를 돌려줄 수 있으므로,
// 스테이지를 만들기 전에 어느 플래그의 어느 원문 값이 잘못됐는지 경계에서 밝혀 준다.
function parseNumericArg(raw: string, flag: string): number {
  const value = Number(raw);

  if (!Number.isFinite(value)) {
    throw new Error(`${flag}의 값은 유한한 숫자여야 합니다: ${raw}`);
  }

  return value;
}

// codeStep 452 — 사람이 짧게 쓰는 h와 v도 받아 내부의 닫힌 Direction 유니온으로 바꾼다.
function parseDirection(raw: string): Direction {
  if (raw === "horizontal" || raw === "h") {
    return "horizontal";
  }
  if (raw === "vertical" || raw === "v") {
    return "vertical";
  }

  throw new Error(`flip 방향은 horizontal, vertical, h, v 중 하나여야 합니다: ${raw}`);
}

// codeStep 452 — rotateStage는 Rotation 유니온만 받으므로 코드 안의 잘못된 각도는 타입이 막는다.
// 하지만 명령줄에서 들어온 값은 그냥 string이라 그 보호가 끝난다. 이 경계에서 사람이 다시
// 검사하고 좁혀야만 런타임 문자열도 타입이 약속한 "90" | "180" | "270"이 된다.
function parseRotation(raw: string): Rotation {
  if (raw === "90" || raw === "180" || raw === "270") {
    return raw;
  }

  throw new Error(`회전 각도는 90, 180, 270 중 하나여야 합니다: ${raw}`);
}

// codeStep 452 — as const로 키와 arity 리터럴을 보존하고, satisfies로 모든 항목이
// FlagSpec 모양인지 검사한다. 둘을 함께 써야 "얼리기"와 "모양 검사"를 모두 얻는다.
const FLAG_SPEC = {
  "--invert": {
    arity: 0,
    build: () => invertStage(),
  },
  // codeStep 455 — grayscaleStage는 RGBA8을 Gray8로 바꾸므로 뒤의 blur가 요구하는 RGBA8과
  // 이어지지 않고, 마지막 Gray8도 colorType 6으로 인코딩할 수 없다. saturateStage(0)은 화면상
  // 같은 회색을 만들면서 RGBA8을 유지해, "회색으로 만들기"를 포맷에 맞는 체인으로 완성한다.
  "--grayscale": {
    arity: 0,
    build: () => grayscaleStage(),
  },
  "--brightness": {
    arity: 1,
    build: (args) => brightnessStage(parseNumericArg(args[0], "--brightness")),
  },
  "--contrast": {
    arity: 1,
    build: (args) => contrastStage(parseNumericArg(args[0], "--contrast")),
  },
  "--threshold": {
    arity: 1,
    build: (args) => thresholdStage(parseNumericArg(args[0], "--threshold")),
  },
  "--saturate": {
    arity: 1,
    build: (args) => saturateStage(parseNumericArg(args[0], "--saturate")),
  },
  "--blur": {
    arity: 1,
    build: (args) => boxBlurStage(parseNumericArg(args[0], "--blur")),
  },
  "--gaussian": {
    arity: 0,
    build: () => gaussianBlurStage(),
  },
  "--sharpen": {
    arity: 0,
    build: () => sharpenStage(),
  },
  "--flip": {
    arity: 1,
    build: (args) => flipStage(parseDirection(args[0])),
  },
  "--rotate": {
    arity: 1,
    build: (args) => rotateStage(parseRotation(args[0])),
  },
} as const satisfies Record<string, FlagSpec>;

// codeStep 453 — 실행 스테이지를 만드는 플래그와 CLI 자체의 선택을 나타내는 옵션은
// 서로 다른 표에 둔다. 옵션은 스테이지를 만들지 않으므로 소비할 인자 수만 알면 된다.
interface OptionSpec {
  readonly arity: number;
}

const OPTION_SPEC = {
  "--save": { arity: 1 },
  "--chain": { arity: 1 },
  "-o": { arity: 1 },
  "--plan": { arity: 0 },
} as const satisfies Record<string, OptionSpec>;

interface CliOptions {
  readonly save?: string;
  readonly chain?: string;
  readonly output?: string;
  readonly plan?: boolean;
}

// codeStep 452 — 런타임 문자열이 실제 테이블 키인지 확인한 사실을 타입 검사기에도 전달한다.
function isKnownFlag(flag: string): flag is keyof typeof FLAG_SPEC {
  // Object.prototype에서 물려받은 이름까지 플래그로 오해하지 않도록 자체 키만 검사한다.
  return Object.hasOwn(FLAG_SPEC, flag);
}

// codeStep 453 — 옵션 표도 런타임 문자열을 자신의 키 유니온으로 좁힌다.
function isKnownOption(flag: string): flag is keyof typeof OPTION_SPEC {
  return Object.hasOwn(OPTION_SPEC, flag);
}

// codeStep 453 — 한 줄에 섞인 CLI 옵션은 따로 모으고, 스테이지 파서가 읽을 나머지는
// 원래 순서대로 남겨 둔다. 같은 옵션을 두 번 쓰면 어느 경로가 최종 값인지 모호해지므로 거부한다.
function splitCliArgs(
  argv: readonly string[],
): { options: CliOptions; stageArgs: string[] } {
  const stageArgs: string[] = [];
  let save: string | undefined;
  let chain: string | undefined;
  let output: string | undefined;
  let plan: boolean | undefined;
  let index = 0;

  while (index < argv.length) {
    const token = argv[index];

    if (isKnownOption(token)) {
      const spec = OPTION_SPEC[token];
      const args = argv.slice(index + 1, index + 1 + spec.arity);
      if (args.length < spec.arity) {
        throw new Error(`${token}는 인자 ${spec.arity}개가 필요합니다`);
      }

      if (token === "--save") {
        if (save !== undefined) {
          throw new Error("--save는 한 번만 사용할 수 있습니다");
        }
        save = args[0];
      } else if (token === "--chain") {
        if (chain !== undefined) {
          throw new Error("--chain은 한 번만 사용할 수 있습니다");
        }
        chain = args[0];
      } else if (token === "-o") {
        if (output !== undefined) {
          throw new Error("-o는 한 번만 사용할 수 있습니다");
        }
        output = args[0];
      } else {
        if (plan !== undefined) {
          throw new Error("--plan은 한 번만 사용할 수 있습니다");
        }
        plan = true;
      }

      index += 1 + spec.arity;
      continue;
    }

    if (isKnownFlag(token)) {
      const spec = FLAG_SPEC[token];
      // 두 표가 같은 문자열 열을 나눠 읽는다. 스테이지 플래그와 그 인자를 통째로
      // 건너뛰어야 `--blur --save`의 --save를 별도 옵션으로 오해하지 않는다.
      stageArgs.push(...argv.slice(index, index + 1 + spec.arity));
      index += 1 + spec.arity;
      continue;
    }

    // 모르는 토큰은 스테이지 파서에 남겨, 기존처럼 알 수 없는 플래그 오류를 내게 한다.
    stageArgs.push(token);
    index += 1;
  }

  const options: CliOptions = {
    ...(save === undefined ? {} : { save }),
    ...(chain === undefined ? {} : { chain }),
    ...(output === undefined ? {} : { output }),
    ...(plan === undefined ? {} : { plan }),
  };
  return { options, stageArgs };
}

// codeStep 452 — 스펙의 arity만큼 인자를 소비하고 같은 순서로 스테이지를 쌓는다.
// 지금은 오류를 잡거나 process.exit를 부르지 않는다. codeStep 454에서 위치를 담은 사람이 읽기
// 좋은 메시지와 종료 코드로 바꿀 예정이므로, 이번 단계에서는 잡히지 않은 예외가 정상이다.
function parseFlags(argv: readonly string[]): ExecutableStage[] {
  const stages: ExecutableStage[] = [];
  let index = 0;

  while (index < argv.length) {
    const flag = argv[index];
    if (!isKnownFlag(flag)) {
      throw new Error(`알 수 없는 플래그: ${flag}`);
    }

    const spec = FLAG_SPEC[flag];
    const args = argv.slice(index + 1, index + 1 + spec.arity);
    if (args.length < spec.arity) {
      throw new Error(`${flag}는 인자 ${spec.arity}개가 필요합니다`);
    }

    stages.push(spec.build(args));
    index += 1 + spec.arity;
  }

  return stages;
}

// codeStep 453 — 실행 계획을 사람이 읽고 다시 건네줄 수 있는 JSON 파일로 보존한다.
function saveChain(stages: readonly ExecutableStage[], path: string): void {
  // JSON.stringify는 kind·in·out과 각 스테이지의 매개변수만 남기고 run 함수는 지운다.
  // JSON은 함수도 타입도 들고 다닐 수 없으므로 이 파일 하나만으로는 아무것도 실행할 수 없다.
  // 다시 읽는 경계에서 각 종류의 생성자를 불러 손실된 실행 함수를 채워야 한다.
  writeFileSync(path, JSON.stringify(stages, null, 2));
}

// codeStep 453 — JSON.parse의 unknown 값에서 필드를 읽을 수 있는 최소한 객체 경계다.
// 배열과 null도 typeof 결과가 object이므로 명시적으로 제외한다.
function asStageRecord(value: unknown, index: number): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`체인 파일 ${index + 1}번째 항목은 객체여야 합니다`);
  }

  return value as Record<string, unknown>;
}

function readNumberField(
  record: Record<string, unknown>,
  field: string,
  index: number,
): number {
  const value = record[field];
  if (typeof value !== "number") {
    throw new Error(`체인 파일 ${index + 1}번째 항목의 ${field}는 숫자여야 합니다`);
  }
  return value;
}

function readEdgePolicy(value: unknown, index: number): EdgePolicy {
  if (value === "clamp" || value === "wrap" || value === "mirror") {
    return value;
  }

  throw new Error(
    `체인 파일 ${index + 1}번째 항목의 edge는 clamp, wrap, mirror 중 하나여야 합니다`,
  );
}

// 생성자가 범위·정수·홀수 같은 불변식을 거부하면 파일의 몇 번째 값인지를 덧붙인다.
function rebuildStage(
  index: number,
  build: () => ExecutableStage,
): ExecutableStage {
  try {
    return build();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`체인 파일 ${index + 1}번째 항목: ${message}`);
  }
}

// codeStep 453 — 저장된 객체를 ExecutableStage로 단언하지 않고 kind로 갈래를 나눈 뒤
// 해당 생성자를 다시 부른다. 단언은 JSON.stringify가 지운 run을 만들어 내지 못해,
// run이 undefined인 객체가 실행기에 들어간 뒤 실행 순간에야 터지게 한다. 생성자 재호출만이
// 실행 함수를 되살리는 동시에 파일에서 온 값을 CLI에서 온 값과 같은 규칙으로 검사한다.
// 따라서 `--blur 4`가 명령줄에서 거부되듯 side: 4도 파일을 읽는 순간 거부된다.
// 입구가 둘이어도 검증을 생성자에 두었기 때문에 규칙은 하나로 유지된다.
function validateStage(value: unknown, index: number): ExecutableStage {
  const record = asStageRecord(value, index);
  const kind = record.kind;

  if (typeof kind !== "string") {
    throw new Error(`체인 파일 ${index + 1}번째 항목의 kind는 문자열이어야 합니다`);
  }

  switch (kind) {
    case "invert":
      return invertStage();
    case "grayscale":
      return grayscaleStage();
    case "brightness": {
      const amount = readNumberField(record, "amount", index);
      return rebuildStage(index, () => brightnessStage(amount));
    }
    case "contrast": {
      const amount = readNumberField(record, "amount", index);
      return rebuildStage(index, () => contrastStage(amount));
    }
    case "threshold": {
      const level = readNumberField(record, "level", index);
      return rebuildStage(index, () => thresholdStage(level));
    }
    case "saturate": {
      const factor = readNumberField(record, "factor", index);
      return rebuildStage(index, () => saturateStage(factor));
    }
    case "convolve": {
      const effect = record.effect;
      if (typeof effect !== "string") {
        throw new Error(`체인 파일 ${index + 1}번째 항목의 effect는 문자열이어야 합니다`);
      }

      const edge = readEdgePolicy(record.edge, index);
      switch (effect) {
        case "box": {
          const side = readNumberField(record, "side", index);
          return rebuildStage(index, () => boxBlurStage(side, edge));
        }
        case "gaussian":
          return gaussianBlurStage(edge);
        case "sharpen":
          return sharpenStage(edge);
        default:
          throw new Error(
            `체인 파일 ${index + 1}번째 항목의 convolve effect를 알 수 없습니다: ${effect}`,
          );
      }
    }
    case "flip": {
      const direction = record.direction;
      if (direction !== "horizontal" && direction !== "vertical") {
        throw new Error(
          `체인 파일 ${index + 1}번째 항목의 direction은 horizontal 또는 vertical이어야 합니다`,
        );
      }
      return flipStage(direction);
    }
    case "rotate": {
      const rotation = record.rotation;
      if (rotation !== "90" && rotation !== "180" && rotation !== "270") {
        throw new Error(
          `체인 파일 ${index + 1}번째 항목의 rotation은 90, 180, 270 중 하나여야 합니다`,
        );
      }
      return rotateStage(rotation);
    }
    default:
      throw new Error(`체인 파일 ${index + 1}번째 항목의 kind를 알 수 없습니다: ${kind}`);
  }
}

// codeStep 453 — JSON.parse의 반환값을 unknown으로 받아, 배열이라는 것을 확인한 뒤에만
// 각 항목을 검증 및 재구성 경계로 보낸다.
function loadChain(path: string): ExecutableStage[] {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(parsed)) {
    throw new Error("체인 파일의 최상위 값은 배열이어야 합니다");
  }

  const values: readonly unknown[] = parsed;
  return values.map((value, index) => validateStage(value, index));
}

// codeStep 452 — 문법 오류가 어느 경로에서 나도 같은 한 줄 사용법을 보여 준다.
const CLI_USAGE =
  "사용법: imgfx apply <입력파일> [스테이지 플래그…] [--save <파일>] [--chain <파일>] [-o <경로>] [--plan]";

// codeStep 454 — 명령줄과 체인 파일 중 하나에서 만든 배열을 실행기에 연결한다. --plan은
// 코덱을 전혀 부르지 않는 계획 전용 경로이고, -o가 없으면 기존처럼 계획과 JSON만 보는 드라이런이다.
function runCli(argv: readonly string[]): void {
  const command = argv[0];
  if (command !== "apply") {
    throw new Error(`지원하지 않는 명령: ${command ?? "(없음)"}\n${CLI_USAGE}`);
  }

  const inputPath = argv[1];
  if (inputPath === undefined) {
    throw new Error(`입력 파일이 필요합니다\n${CLI_USAGE}`);
  }

  const { options, stageArgs } = splitCliArgs(argv.slice(2));
  if (options.chain !== undefined && stageArgs.length > 0) {
    throw new Error("--chain과 스테이지 플래그는 함께 쓸 수 없습니다");
  }

  const stages = options.chain === undefined
    ? parseFlags(stageArgs)
    : loadChain(options.chain);
  const source = options.chain === undefined ? "명령줄" : `체인파일 ${options.chain}`;

  console.log(`CLI 입력 ${inputPath} / 출처 ${source} / 스테이지 ${stages.length}개`);

  if (options.plan === true) {
    // 계획만 보여 달라는 요청과 파일을 만들어 달라는 요청은 서로 어긋난다. 하나를 조용히
    // 무시하면 사용자는 만들어졌다고 믿은 파일이 없는 것을 나중에야 알게 되므로 여기서 막는다.
    if (options.output !== undefined || options.save !== undefined) {
      throw new Error("--plan은 -o·--save와 함께 쓸 수 없습니다");
    }

    resetPipelineCounts();
    console.log(`CLI 계획 ${planPipeline(stages).join(" / ")}`);
    console.log(`CLI 계획 실행 뒤 디코딩 ${decodeCount} / 인코딩 ${encodeCount}`);
    return;
  }

  console.log(`CLI 계획 ${planPipeline(stages).join(" / ")}`);
  // JSON.stringify는 run 함수 프로퍼티를 생략하며, loadChain이 생성자로 그 손실을 메운다.
  console.log(`CLI JSON ${JSON.stringify(stages)}`);

  if (options.save !== undefined) {
    saveChain(stages, options.save);
    console.log(`CLI 저장 ${options.save} / 스테이지 ${stages.length}개`);
  }

  if (options.output !== undefined) {
    resetPipelineCounts();
    const inputBytes = readFileSync(inputPath);
    const inputPng = PNG.sync.read(inputBytes);
    const outputBytes = runPipeline(inputBytes, stages);
    writeFileSync(options.output, outputBytes);

    // 반환값만 믿지 않고 방금 쓴 파일을 다시 열어, 디스크의 결과가 실제 PNG인지와 크기를 확인한다.
    const writtenBytes = readFileSync(options.output);
    const outputPng = PNG.sync.read(writtenBytes);
    // 회전은 픽셀 수를 바꾸지 않아도 PNG 압축 결과의 바이트 수는 크게 달라질 수 있으므로,
    // 원본과 결과를 한 줄에서 나란히 비교한다.
    console.log(
      `CLI 실행 ${options.output} / 디코딩 ${decodeCount} / 인코딩 ${encodeCount} / ` +
        `크기 ${inputPng.width}x${inputPng.height} -> ${outputPng.width}x${outputPng.height} / ` +
        `바이트 ${inputBytes.length} -> ${writtenBytes.length}`,
    );
  }
}

function main(): void {
  // 한 파일이 두 얼굴을 갖던 임시 분기를 파일 경계가 대신한다. 관찰은 observe.ts가 맡으므로,
  // CLI를 인자 없이 실행하면 사용법을 알리고 실패 종료 코드로 명령이 빠졌음을 드러낸다.
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    console.error(CLI_USAGE);
    process.exitCode = 1;
    return;
  }

  // codeStep 454 — 셸 스크립트와 CI는 종료 코드 0과 1로 성공과 실패를 가른다. 성공 경로는
  // Node의 기본값 0을 그대로 두고, 실패만 사람이 읽는 한 줄을 stderr로 보낸 뒤 1로 표시한다.
  try {
    runCli(argv);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    // process.exit(1)은 아직 flush되지 않은 stdout·stderr를 자를 수 있다. exitCode만 세우면
    // Node가 남은 출력을 정상적으로 비운 뒤 같은 종료 코드를 셸에 돌려준다.
    process.exitCode = 1;
  }
}

main();

