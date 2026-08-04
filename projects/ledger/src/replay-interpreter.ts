/*
 * §17 ledger 프로젝트의 기록·리플레이 인터프리터 파일입니다.
 *
 * 실행 위치:
 *   cd projects/ledger
 *   node src/replay-interpreter.ts
 *
 * 타입 검사는 두 위치에서 모두 통과해야 합니다.
 *   저장소 루트: npx tsc --noEmit
 *   projects/ledger: npx tsc -p .
 *
 * 기록은 실제 인터프리터를 감싸 커맨드와 결과를 옆에서 남기는 일입니다. 그래서
 * 정상 실행과 똑같이 저널을 읽고 쓰며, 동작 자체를 바꾸지 않습니다.
 *
 * 리플레이는 기록된 읽기 결과를 다시 돌려주고, 쓰기와 출력은 실제로 실행하지
 * 않습니다. 과거 실행을 다시 살펴보는 모드이므로 같은 저널 파일을 다시 고치거나
 * 같은 사용자 출력을 다시 실행하지 않습니다.
 *
 * 이 파일도 node:fs를 import하지 않습니다. 로그 파일을 읽고 쓰는 일도
 * interpreter.ts의 runCommand를 지나가게 두어, ledger에서 파일 시스템을 직접
 * 부르는 자리가 계속 interpreter.ts 하나로 남게 합니다.
 */

import { runCommand } from "./interpreter.ts";
import type { EffectCommand, Interpreter, ReadClockCommand, ReadJournalCommand } from "./interpreter.ts";

/*
 * result는 선택 속성입니다. undefined는 JSON.stringify가 필드 자체를 빼므로,
 * 결과가 없는 커맨드는 메모리 위에서도 파일 위에서도 result가 없는 모양으로 둡니다.
 *
 * argv도 함께 남깁니다. 리플레이가 기록된 입력만으로 같은 결정을 다시 만든다는
 * 사실을 보이려면, 사용자가 친 명령행도 그 입력에 포함되어야 하기 때문입니다.
 */
type LogEntry = { readonly command: EffectCommand; readonly result?: string };
type RunLog = { readonly argv: readonly string[]; readonly entries: readonly LogEntry[] };

type ReadLogEntry = LogEntry & { readonly command: ReadJournalCommand | ReadClockCommand };

function isReadLogEntry(entry: LogEntry): entry is ReadLogEntry {
  return entry.command.kind === "readJournal" || entry.command.kind === "readClock";
}

/*
 * 실제 runCommand를 먼저 호출한 뒤 같은 커맨드와 결과를 배열에 남깁니다.
 * 결과가 undefined이면 result 필드를 만들지 않아 JSON에 적히는 모양과 맞춥니다.
 */
function recordCommand(cmd: EffectCommand, entries: LogEntry[]): string | void {
  const result = runCommand(cmd);

  if (result === undefined) {
    entries.push({ command: cmd });
  } else {
    entries.push({ command: cmd, result });
  }

  return result;
}

/*
 * 로그 저장도 writeJournal 커맨드로 표현합니다. 이름은 저널이지만 의미는
 * "이 경로에 이 문자열을 쓴다"이므로, 로그 파일에도 같은 경계를 재사용합니다.
 */
function saveRunLog(path: string, log: RunLog): void {
  runCommand({
    kind: "writeJournal",
    path,
    content: `${JSON.stringify(log, null, 2)}\n`,
  });
}

/*
 * 로그 적재도 readJournal 커맨드로 표현합니다. 이 파일이 node:fs를 직접 부르면
 * 파일 시스템 경계가 둘로 갈라지므로, 기존 인터프리터 문을 그대로 통과합니다.
 */
function loadRunLog(path: string): RunLog {
  return JSON.parse(runCommand({ kind: "readJournal", path }) as string) as RunLog;
}

/*
 * 리플레이 인터프리터는 읽기 커맨드만 미리 걸러 둔 뒤 순서대로 소비합니다.
 * 쓰기나 출력 항목이 로그 사이에 끼어 있어도 읽기 결과의 순서는 어긋나지 않습니다.
 */
function makeReplayInterpreter(log: RunLog): Interpreter {
  const readEntries = log.entries.filter(isReadLogEntry);
  let nextReadIndex = 0;

  return (cmd: EffectCommand): string | void => {
    switch (cmd.kind) {
      case "readJournal":
      case "readClock": {
        const entry = readEntries[nextReadIndex];
        nextReadIndex += 1;

        if (entry === undefined) {
          throw new Error(`[리플레이] 기록된 읽기가 부족합니다: ${cmd.kind}`);
        }

        if (entry.command.kind !== cmd.kind) {
          throw new Error(`[리플레이] 읽기 종류가 다릅니다: 기록 ${entry.command.kind}, 실행 ${cmd.kind}`);
        }

        if (entry.result === undefined) {
          throw new Error(`[리플레이] 읽기 결과가 없습니다: ${entry.command.kind}`);
        }

        return entry.result;
      }
      case "writeJournal":
        console.log(`[리플레이] ${cmd.path}에 쓸 내용:\n${cmd.content}`);
        break;
      case "print":
        console.log(`[리플레이] 출력할 내용: ${cmd.text}`);
        break;
      default: {
        const _exhaustive: never = cmd;
        throw new Error("알 수 없는 커맨드");
      }
    }
  };
}

// 이 파일은 최상위 실행문을 두지 않으므로, import 되어도 아무 일도 일어나지 않습니다.

export type { LogEntry, RunLog };
export { loadRunLog, makeReplayInterpreter, recordCommand, saveRunLog };

/*
 * 실측 기록
 *
 * 실행 위치: projects/ledger
 *
 * $ node src/replay-interpreter.ts
 * 출력 없음
 * 종료 코드: 0
 *
 * 이 파일은 최상위 실행문이 없으므로 직접 실행해도 아무것도 출력하지 않습니다.
 *
 * $ npx tsc -p .
 * 출력 없음
 * 종료 코드: 0
 *
 * 실행 위치: 저장소 루트
 *
 * $ npx tsc --noEmit
 * 출력 없음
 * 종료 코드: 0
 */
