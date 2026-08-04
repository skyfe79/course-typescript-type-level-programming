/*
 * §17 ledger 프로젝트의 실행 로그 재생 확인 스크립트입니다.
 *
 * 실행 위치:
 *   cd projects/ledger
 *   node src/verify-replay.ts
 *
 * 타입 검사는 두 위치에서 모두 통과해야 합니다.
 *   저장소 루트: npx tsc --noEmit
 *   projects/ledger: npx tsc -p .
 *
 * 이 스크립트는 run-log.json에 남은 읽기 결과와 argv를 입력으로 삼아 add 실행을
 * 다시 통과시킵니다. 같은 저널 문자열과 같은 시각이 들어가면 순수 코어의 결정도
 * 같아야 하므로, 새로 만들어진 쓰기·출력 커맨드가 원래 실행의 커맨드와 완전히
 * 같아야 합니다.
 *
 * 리플레이 중 쓰기와 출력은 배열에만 모으고 실행하지 않습니다. 따라서 이 스크립트는
 * journal.json도 run-log.json도 바꾸지 않고, 일치 여부만 화면에 보여 줍니다.
 */

import { RUN_LOG_PATH, parseCommand, runAdd, takeFlags } from "./cli.ts";
import type { Command } from "./cli.ts";
import type { EffectCommand, Interpreter } from "./interpreter.ts";
import { loadRunLog, makeReplayInterpreter } from "./replay-interpreter.ts";

type ObservedCommand = Extract<EffectCommand, { readonly kind: "writeJournal" | "print" }>;

function isObservedCommand(command: EffectCommand): command is ObservedCommand {
  return command.kind === "writeJournal" || command.kind === "print";
}

/*
 * 확인 대상은 바깥세상을 바꾸는 쓰기와 사용자가 보게 되는 출력입니다.
 * 읽기 커맨드는 리플레이 인터프리터가 로그에 기록된 결과를 그대로 돌려줍니다.
 */
function collectOriginalCommands(logEntries: readonly { readonly command: EffectCommand }[]): ObservedCommand[] {
  return logEntries.map((entry) => entry.command).filter(isObservedCommand);
}

/*
 * 리플레이 인터프리터를 한 겹 감싸서 읽기는 그대로 맡기고, 쓰기와 출력은 실행하지
 * 않은 채 배열에 담습니다. 그래서 [리플레이] 로그도 이 스크립트에서는 찍히지 않습니다.
 */
function makeCollectingInterpreter(logInterpreter: Interpreter, commands: ObservedCommand[]): Interpreter {
  return (command: EffectCommand): string | void => {
    switch (command.kind) {
      case "readJournal":
      case "readClock":
        return logInterpreter(command);
      case "writeJournal":
      case "print":
        commands.push(command);
        break;
      default: {
        const _exhaustive: never = command;
        throw new Error("알 수 없는 커맨드");
      }
    }
  };
}

function verifyAddCommand(command: Command): command is Extract<Command, { readonly kind: "add" }> {
  if (command.kind === "add") return true;

  console.log(`기록된 실행이 add가 아닙니다: ${command.kind}`);
  process.exitCode = 1;
  return false;
}

const log = loadRunLog(RUN_LOG_PATH);
const originalCommands = collectOriginalCommands(log.entries);
const replayedCommands: ObservedCommand[] = [];
const collectingInterpreter = makeCollectingInterpreter(makeReplayInterpreter(log), replayedCommands);

const command = parseCommand([...log.argv]);

if (verifyAddCommand(command)) {
  const { rest } = takeFlags(command.args);
  runAdd(rest, collectingInterpreter);

  if (JSON.stringify(originalCommands) === JSON.stringify(replayedCommands)) {
    console.log("리플레이 일치");
    console.log(`비교한 커맨드 수: ${originalCommands.length}`);
  } else {
    console.log("리플레이 불일치");
    console.log("원래 실행의 쓰기·출력 커맨드:");
    console.log(JSON.stringify(originalCommands, null, 2));
    console.log("리플레이로 다시 만들어진 쓰기·출력 커맨드:");
    console.log(JSON.stringify(replayedCommands, null, 2));
    process.exitCode = 1;
  }
}

/*
 * 실측 기록
 *
 * 실행 위치: projects/ledger
 *
 * 검증 전에 journal.json과 run-log.json을 복사해 두고, 모든 확인 뒤 원래 내용으로
 * 되돌렸습니다.
 *
 * $ shasum -a 256 journal.json run-log.json
 * cabb5f4ca7f774ceb43efebca269d914a36c15f9a357284d37cef5d10edf4156  journal.json
 * c7e81100268fd2610715fd78de670bd9e75b3b1dd1e6633241976c63437d05fa  run-log.json
 *
 * $ npx tsc -p .
 * 출력 없음
 * 종료 코드: 0
 *
 * $ node src/verify-replay.ts
 * 리플레이 일치
 * 비교한 커맨드 수: 2
 * 종료 코드: 0
 *
 * $ shasum -a 256 journal.json
 * cabb5f4ca7f774ceb43efebca269d914a36c15f9a357284d37cef5d10edf4156  journal.json
 *
 * verify-replay.ts 실행 전 해시도 같은
 * cabb5f4ca7f774ceb43efebca269d914a36c15f9a357284d37cef5d10edf4156였으므로
 * journal.json은 한 바이트도 바뀌지 않았습니다.
 *
 * run-log.json을 잠시 run-log.json.step278-moved로 옮긴 뒤 확인했습니다.
 *
 * $ node src/verify-replay.ts
 * file://<저장소>/projects/ledger/src/replay-interpreter.ts:87
 *     throw new Error(`실행 로그를 찾지 못했습니다. 먼저 node src/cli.ts add ... --record 명령으로 ${path} 파일을 만드십시오.`);
 *           ^
 *
 * Error: 실행 로그를 찾지 못했습니다. 먼저 node src/cli.ts add ... --record 명령으로 run-log.json 파일을 만드십시오.
 *     at loadRunLog (file://<저장소>/projects/ledger/src/replay-interpreter.ts:87:11)
 *     at file://<저장소>/projects/ledger/src/verify-replay.ts:70:13
 *     at ModuleJob.run (node:internal/modules/esm/module_job:430:25)
 *     at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:639:26)
 *     at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)
 *
 * Node.js v25.8.0
 * 종료 코드: 1
 *
 * run-log.json 이름을 되돌리고 journal.json도 복원한 뒤 다시 확인했습니다.
 *
 * $ shasum -a 256 journal.json run-log.json
 * cabb5f4ca7f774ceb43efebca269d914a36c15f9a357284d37cef5d10edf4156  journal.json
 * c7e81100268fd2610715fd78de670bd9e75b3b1dd1e6633241976c63437d05fa  run-log.json
 *
 * 실행 위치: 저장소 루트
 *
 * $ npx tsc --noEmit
 * 출력 없음
 * 종료 코드: 0
 */
