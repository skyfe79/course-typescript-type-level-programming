// 설치된 명령 하나로 다섯 예제를 실행하고, 생성한 자바스크립트의 직접 실행 결과까지 대조한다.

import { spawnSync } from "node:child_process";
import { accessSync, constants } from "node:fs";
import { delimiter, join } from "node:path";

type Example = {
  readonly name: string;
  readonly input: string | undefined;
};

type Execution = {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly error: Error | undefined;
};

type CommandLocation = {
  readonly command: string;
  readonly description: string;
};

const examplesDirectory = join(import.meta.dirname, "examples");

const examples: readonly Example[] = [
  { name: "greet", input: "21\n" },
  { name: "calc", input: "8\n0\n/\n" },
  { name: "gugudan", input: undefined },
  // 답은 실행할 때마다 달라진다. 1부터 100까지 모두 넣으면 어느 답이 뽑혀도 반드시 끝난다.
  {
    name: "guess",
    input: `${Array.from({ length: 100 }, (_, index) => index + 1).join("\n")}\n`,
  },
  { name: "recursion", input: undefined },
];

function findCommand(): CommandLocation {
  const pathDirectories = (process.env.PATH ?? "").split(delimiter);

  for (const directory of pathDirectories) {
    if (directory === "") continue;

    const candidate = join(directory, "tinylang");
    try {
      accessSync(candidate, constants.X_OK);
      return {
        command: candidate,
        description: `PATH의 tinylang (${candidate})`,
      };
    } catch {
      // 이 PATH 항목에 실행 파일이 없으면 다음 항목을 계속 살핀다.
    }
  }

  // npm link를 하지 않은 저장소에서도 워크스페이스가 연결한 로컬 bin을 사용할 수 있다.
  const workspaceCommand = join(
    import.meta.dirname,
    "..",
    "..",
    "node_modules",
    ".bin",
    "tinylang",
  );
  return {
    command: workspaceCommand,
    description: `워크스페이스 node_modules/.bin의 tinylang (${workspaceCommand})`,
  };
}

function execute(command: string, args: readonly string[], input?: string): Execution {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    input,
  });

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error,
  };
}

function printExecution(execution: Execution, summarizeGuess = false): void {
  console.log(`종료 코드: ${execution.status ?? "없음"}`);
  if (execution.error !== undefined) {
    console.log(`실행 오류: ${execution.error.message}`);
  }

  console.log("표준 출력:");
  if (summarizeGuess) {
    const lines = execution.stdout.split(/\r?\n/u).filter((line) => line !== "");
    const firstLine = lines[0] ?? "(없음)";
    const secondLine = lines[1] ?? "(없음)";
    const lastLine = lines.at(-1) ?? "(없음)";
    const upCount = lines.filter((line) => line.endsWith("UP")).length;
    const downCount = lines.filter((line) => line.endsWith("DOWN")).length;

    // 무작위 답에 따라 최대 100줄이 생기므로, 흐름을 확인하는 처음 두 줄과 결말만 남긴다.
    console.log(`첫 번째 줄: ${firstLine}`);
    console.log(`두 번째 줄: ${secondLine}`);
    console.log(`마지막 줄: ${lastLine}`);
    console.log(`UP 힌트: ${upCount}개, DOWN 힌트: ${downCount}개`);
  } else {
    process.stdout.write(execution.stdout);
    if (execution.stdout !== "" && !execution.stdout.endsWith("\n")) console.log();
  }

  if (execution.stderr !== "") {
    console.log("표준 오류:");
    process.stdout.write(execution.stderr);
    if (!execution.stderr.endsWith("\n")) console.log();
  }
}

const commandLocation = findCommand();
console.log(`사용할 명령어: ${commandLocation.description}`);

const runResults = new Map<string, Execution>();

for (const example of examples) {
  console.log(`\n=== tinylang run examples/${example.name}.tl ===`);
  const sourcePath = join(examplesDirectory, `${example.name}.tl`);
  const execution = execute(commandLocation.command, ["run", sourcePath], example.input);
  runResults.set(example.name, execution);
  printExecution(execution, example.name === "guess");
}

console.log("\n=== run과 build → node 결과 대조 ===");
console.log("guess.tl은 실행마다 무작위 답이 달라 문자열 대조에서 제외합니다.");

let matchingCount = 0;

for (const example of examples) {
  if (example.name === "guess") continue;

  const sourcePath = join(examplesDirectory, `${example.name}.tl`);
  // 기본 출력 이름과 겹치지 않아 run이 만든 파일이나 .tl 원본을 덮어쓰지 않는다.
  const outputPath = join(examplesDirectory, `${example.name}.e2e.js`);

  console.log(`\n--- ${example.name}.tl ---`);
  console.log(`tinylang build -o examples/${example.name}.e2e.js`);
  const buildExecution = execute(commandLocation.command, ["build", sourcePath, "-o", outputPath]);
  printExecution(buildExecution);

  console.log(`node examples/${example.name}.e2e.js`);
  const nodeExecution = execute(process.execPath, [outputPath], example.input);
  printExecution(nodeExecution);

  const runExecution = runResults.get(example.name);
  const matches =
    runExecution !== undefined
    && runExecution.status === 0
    && buildExecution.status === 0
    && nodeExecution.status === 0
    && runExecution.stdout === nodeExecution.stdout;

  console.log(`run 출력과 node 출력: ${matches ? "일치" : "불일치"}`);
  if (matches) matchingCount += 1;
}

console.log(`\n요약: 프로그램 ${examples.length}편 실행 / 출력 대조 ${matchingCount}편 일치`);
