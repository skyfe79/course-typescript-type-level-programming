/*
 * §17 ledger 프로젝트의 첫 파일입니다.
 *
 * 실행 위치:
 *   cd projects/ledger
 *   node src/cli.ts add 100 groceries
 *
 * 타입 검사는 두 위치에서 모두 통과해야 합니다.
 *   저장소 루트: npx tsc --noEmit
 *   projects/ledger: npx tsc -p .
 *
 * 이 프로젝트가 지켜 갈 세 가지 보장:
 *   1. 불균형 항목을 만들 수 없습니다.
 *      저널 항목을 만드는 통로를 스마트 생성자 하나로 제한하고,
 *      그 함수 안에서 두 계정 금액의 합이 0인지 확인한 뒤 값을 돌려줍니다.
 *
 *   2. 파싱 경계를 둡니다.
 *      명령행 문자열은 경계에서 한 번만 파싱하고,
 *      검증되지 않은 원시 문자열이 도메인 로직 안으로 다시 들어가지 않게 합니다.
 *
 *   3. 이펙트 경계를 둡니다.
 *      파일 쓰기와 화면 출력 같은 이펙트는 도메인 안에서 바로 실행하지 않고,
 *      커맨드라는 값으로 미뤘다가 인터프리터 계층 하나에서만 실행합니다.
 *
 * 이번 화에서는 add 명령을 순수 코어와 인터프리터에 연결해 보장 3의 실제 경계를
 * 만듭니다. report와 budget은 아직 표면 명령만 남겨 두고 다음 화들에서 채웁니다.
 */

import { decide, parseJournal, parseTransaction } from "./ledger.ts";
import type { Command as CoreCommand, RawTransaction } from "./ledger.ts";
import { runCommandDryRun } from "./dry-run-interpreter.ts";
import { runCommand } from "./interpreter.ts";
import type { Interpreter } from "./interpreter.ts";
import { loadRunLog, makeReplayInterpreter, recordCommand, saveRunLog } from "./replay-interpreter.ts";
import type { LogEntry } from "./replay-interpreter.ts";

/*
 * 이 파일에도 명령행 표면을 나타내는 Command 타입이 있으므로, 순수 코어의
 * 커맨드는 CoreCommand라는 다른 이름으로 가져옵니다. 하나는 사용자가 친 명령이고,
 * 다른 하나는 실행할 이펙트 계획입니다. import가 생겼으므로 이 파일도 모듈이며,
 * 각 Command 이름은 자기 모듈 안에서만 의미를 갖습니다.
 */

type Command =
  | { kind: "add"; args: string[] }
  | { kind: "report"; args: string[] }
  | { kind: "budget"; args: string[] }
  | { kind: "replay"; args: string[] };

function parseCommand(argv: string[]): Command {
  const [kind, ...args] = argv;

  /*
   * 보장 2가 아직 들어오지 않은 거친 스텁입니다.
   *
   * 아래 단언은 "argv[0]이 add, report, budget, replay 중 하나다"라고
   * 타입 검사기에게만 말합니다. 실제 문자열을 확인하지는 않습니다.
   * 그래서 nonsense 같은 값도 Command로 만들어져 main까지 넘어갑니다.
   * 다음 단계에서는 이 자리를 진짜 파싱으로 바꿉니다.
   */
  return { kind: kind as Command["kind"], args };
}

const JOURNAL_PATH = "journal.json";
const RUN_LOG_PATH = "run-log.json";

/*
 * 명령행 인자는 아직 검증되지 않은 문자열이므로 여기서는 원시 거래 모양으로만
 * 옮기고, 실제 검증은 parseTransaction에 맡깁니다. 금액이 숫자가 아니면 Number가
 * NaN을 만들고, 그 NaN은 makeMoney의 검사에 걸려 ok: false 값으로 돌아옵니다.
 * 거래 id는 시계에서 얻은 날짜와 저널 길이에서 나온 순번으로 만들며, 이 실습에서는
 * 차변 계좌를 acct-food, 대변 계좌를 acct-checking으로 고정합니다.
 */
function toRawTransaction(args: readonly string[], now: string, sequence: number): RawTransaction {
  const [amountText = "", memo = "메모 없음"] = args;
  const date = now.slice(0, 10);

  return {
    kind: "simple",
    id: `tx-${date}-${sequence}`,
    date,
    memo,
    debit: { accountId: "acct-food", amountMinor: Number(amountText), currency: "KRW", side: "debit" },
    credit: { accountId: "acct-checking", amountMinor: Number(amountText), currency: "KRW", side: "credit" },
  };
}

/*
 * 순수 코어가 돌려준 커맨드를 인터프리터가 아는 이펙트 커맨드로 옮기는 자리입니다.
 * appendTransaction을 파일에 적을 때 도메인 값 대신 방금 검증한 원시 값 rawInput을
 * 이어 붙입니다. 파일에 저장하는 표현은 중첩된 amount가 아니라 평평한 원시 모양이고,
 * 그 표현을 rawInput이 이미 갖고 있기 때문입니다.
 *
 * exit 커맨드는 process.exit을 바로 부르지 않고 process.exitCode만 정합니다. 그래야
 * 남은 커맨드를 건너뛰지 않고 끝까지 실행한 뒤 종료됩니다.
 */
function runCoreCommand(
  command: CoreCommand,
  rawJournal: readonly RawTransaction[],
  rawInput: RawTransaction,
  run: Interpreter,
): void {
  switch (command.kind) {
    case "appendTransaction":
      run({
        kind: "writeJournal",
        path: JOURNAL_PATH,
        content: `${JSON.stringify([...rawJournal, rawInput], null, 2)}\n`,
      });
      break;
    case "printReport":
      run({ kind: "print", text: command.report });
      break;
    case "exit":
      process.exitCode = command.code;
      break;
  }
}

/*
 * 실행 순서가 이 함수 하나에 다 보입니다. 저널 읽기, 저널 파싱, 시계 읽기,
 * 순수 코어 호출, 돌아온 커맨드 실행 순서입니다. 저널 파일이 깨져 있으면 결정을
 * 내리기 전에 멈춥니다.
 *
 * 이 함수 안에는 fs도 Date도 console도 없습니다. 바깥세상과 닿는 일은 전부
 * 매개변수로 받은 Interpreter를 지나갑니다.
 */
function runAdd(args: readonly string[], run: Interpreter): void {
  const journalText = run({ kind: "readJournal", path: JOURNAL_PATH }) as string;
  const rawJournal = JSON.parse(journalText) as RawTransaction[];

  const journal = parseJournal(rawJournal);
  if (!journal.ok) {
    run({ kind: "print", text: `저널을 읽지 못했습니다: ${journal.error}` });
    process.exitCode = 1;
    return;
  }

  const now = run({ kind: "readClock" }) as string;
  const rawInput = toRawTransaction(args, now, rawJournal.length + 1);

  for (const command of decide(journal.value, parseTransaction(rawInput))) {
    runCoreCommand(command, rawJournal, rawInput, run);
  }
}

/*
 * 기록용 인터프리터는 runCommand를 감싼 것이므로 --record 실행은 진짜 실행입니다.
 * journal.json도 실제로 바뀌고, 그 뒤에 같은 실행에서 지나간 커맨드를 run-log.json에
 * 저장합니다.
 */
function runAddRecording(args: readonly string[], argv: readonly string[]): void {
  const entries: LogEntry[] = [];
  runAdd(args, (cmd) => recordCommand(cmd, entries));
  saveRunLog(RUN_LOG_PATH, { argv, entries });
}

/*
 * replay 명령은 run-log.json에 남은 argv를 다시 파싱해 같은 runAdd를 한 번 더 돕니다.
 * 이번에는 리플레이 인터프리터를 넘기므로 저널과 시계는 기록에서 나오고, 쓰기와 출력은
 * 실행하지 않고 [리플레이] 표시와 함께 무엇을 하려 했는지만 보여 줍니다. 그래서 몇 번을
 * 재생해도 journal.json과 run-log.json은 바뀌지 않습니다.
 *
 * 지금 기록하는 실행은 add뿐이므로, 로그의 명령이 add가 아니면 재생하지 않고 멈춥니다.
 */
function runReplay(): void {
  const log = loadRunLog(RUN_LOG_PATH);
  const recorded = parseCommand([...log.argv]);

  if (recorded.kind !== "add") {
    console.log(`기록된 실행이 add가 아닙니다: ${recorded.kind}`);
    process.exitCode = 1;
    return;
  }

  const { rest } = takeFlags(recorded.args);
  runAdd(rest, makeReplayInterpreter(log));
}

/*
 * parseCommand는 아직 플래그를 모르는 단순한 표면 파서입니다. 그래서 add 인자에
 * 섞여 들어온 --dry-run 같은 플래그는 add 실행 직전에 한 번 걸러 냅니다.
 * 지금은 알 수 없는 --플래그도 조용히 빼고, 실제 거래 인자만 rest에 남깁니다.
 */
function takeFlags(args: readonly string[]): { rest: string[]; dryRun: boolean; record: boolean } {
  const rest: string[] = [];
  let dryRun = false;
  let record = false;

  for (const arg of args) {
    if (!arg.startsWith("--")) {
      rest.push(arg);
      continue;
    }

    if (arg === "--dry-run") dryRun = true;
    if (arg === "--record") record = true;
  }

  return { rest, dryRun, record };
}

function main(command: Command, argv: readonly string[]): void {
  switch (command.kind) {
    case "add": {
      const { rest, dryRun, record } = takeFlags(command.args);

      if (dryRun) {
        runAdd(rest, runCommandDryRun);
      } else if (record) {
        runAddRecording(rest, argv);
      } else {
        runAdd(rest, runCommand);
      }

      break;
    }
    case "report":
      console.log("report 명령은 아직 구현되지 않았습니다.");
      console.log(`인자: ${command.args.join(", ")}`);
      break;
    case "budget":
      console.log("budget 명령은 아직 구현되지 않았습니다.");
      console.log(`인자: ${command.args.join(", ")}`);
      break;
    case "replay":
      runReplay();
      break;
    default: {
      /*
       * 위 네 case가 Command 유니온을 모두 소진하면, 이 위치의 command는
       * never로 좁혀집니다. 그래서 지금은 아래 대입이 컴파일됩니다.
       *
       * 나중에 Command에 다섯 번째 kind를 더하고 switch 분기를 빠뜨리면,
       * command가 더 이상 never가 아니므로 이 줄이 곧바로 컴파일 오류가 됩니다.
       * 빠진 분기를 타입 검사 단계에서 확인하게 해 주는 완전성 검사입니다.
       */
      const _exhaustive: never = command;
      throw new Error("알 수 없는 명령");
    }
  }
}

const argv = process.argv.slice(2);

/*
 * 직접 실행하면 CLI로 동작하고, 다른 파일이 import하면 조용한 모듈로 남습니다.
 * verify-replay.ts는 이 성질 덕분에 runAdd만 가져와 같은 코어 경로를 다시 돕니다.
 */
if (import.meta.main) {
  main(parseCommand(argv), argv);
}

export type { Command };
export { JOURNAL_PATH, RUN_LOG_PATH, parseCommand, runAdd, takeFlags };

/*
 * 실측 기록
 *
 * 실행 위치: projects/ledger
 *
 * 거래 세 개가 들어 있는 journal.json과 직전 단계의 run-log.json에서 시작했습니다.
 * 검증 전에 파일을 복사해 두고, 아래 확인을 끝낸 뒤 원래 내용으로 되돌렸습니다.
 *
 * $ shasum -a 256 journal.json run-log.json
 * cabb5f4ca7f774ceb43efebca269d914a36c15f9a357284d37cef5d10edf4156  journal.json
 * c7e81100268fd2610715fd78de670bd9e75b3b1dd1e6633241976c63437d05fa  run-log.json
 *
 * $ npx tsc -p .
 * 출력 없음
 * 종료 코드: 0
 *
 * 이번 변경에서는 cli.ts를 다른 파일이 import해도 바로 실행되지 않게 했습니다.
 * 직접 실행하는 CLI 동작은 그대로인지 아래 세 명령으로 확인했습니다.
 *
 * $ node src/cli.ts add 100 식비 --dry-run
 * [드라이런] journal.json에 쓸 내용:
 * [
 *   {
 *     "kind": "simple",
 *     "id": "tx-2026-08-04-1",
 *     "date": "2026-08-04",
 *     "memo": "점심",
 *     "debit": {
 *       "accountId": "acct-food",
 *       "amountMinor": 15000,
 *       "currency": "KRW",
 *       "side": "debit"
 *     },
 *     "credit": {
 *       "accountId": "acct-checking",
 *       "amountMinor": 15000,
 *       "currency": "KRW",
 *       "side": "credit"
 *     }
 *   },
 *   {
 *     "kind": "simple",
 *     "id": "tx-2026-08-04-2",
 *     "date": "2026-08-04",
 *     "memo": "점심",
 *     "debit": {
 *       "accountId": "acct-food",
 *       "amountMinor": 15000,
 *       "currency": "KRW",
 *       "side": "debit"
 *     },
 *     "credit": {
 *       "accountId": "acct-checking",
 *       "amountMinor": 15000,
 *       "currency": "KRW",
 *       "side": "credit"
 *     }
 *   },
 *   {
 *     "kind": "simple",
 *     "id": "tx-2026-08-04-3",
 *     "date": "2026-08-04",
 *     "memo": "커피",
 *     "debit": {
 *       "accountId": "acct-food",
 *       "amountMinor": 5000,
 *       "currency": "KRW",
 *       "side": "debit"
 *     },
 *     "credit": {
 *       "accountId": "acct-checking",
 *       "amountMinor": 5000,
 *       "currency": "KRW",
 *       "side": "credit"
 *     }
 *   },
 *   {
 *     "kind": "simple",
 *     "id": "tx-2026-08-04-4",
 *     "date": "2026-08-04",
 *     "memo": "식비",
 *     "debit": {
 *       "accountId": "acct-food",
 *       "amountMinor": 100,
 *       "currency": "KRW",
 *       "side": "debit"
 *     },
 *     "credit": {
 *       "accountId": "acct-checking",
 *       "amountMinor": 100,
 *       "currency": "KRW",
 *       "side": "credit"
 *     }
 *   }
 * ]
 *
 * [드라이런] 출력할 내용: 기록 완료. 누적 차변 합계: 35100
 * 종료 코드: 0
 *
 * $ node src/cli.ts add 100 식비
 * 기록 완료. 누적 차변 합계: 35100
 * 종료 코드: 0
 *
 * $ node -e 'const j=require("./journal.json"); console.log(j.length); console.log(j.at(-1).memo); console.log(j.at(-1).debit.amountMinor);'
 * 4
 * 식비
 * 100
 *
 * $ node src/cli.ts report
 * report 명령은 아직 구현되지 않았습니다.
 * 인자:
 * 종료 코드: 0
 *
 * 위 확인 뒤 journal.json을 원래 내용으로 되돌렸습니다. 아래 --record 묶음은
 * 직전 단계에서 run-log.json을 만들 때 남긴 실측 기록입니다.
 *
 * --record는 실제 실행을 기록하므로 journal.json에 거래가 하나 늘고,
 * run-log.json에는 실행 커맨드와 읽기 결과가 남습니다.
 *
 * $ node src/cli.ts add 5000 커피 --record
 * 기록 완료. 누적 차변 합계: 35000
 * 종료 코드: 0
 *
 * $ node -e 'const j=require("./journal.json"); console.log(j.length); console.log(j.at(-1).memo); console.log(j.at(-1).debit.amountMinor);'
 * 3
 * 커피
 * 5000
 *
 * $ node -e 'const log=require("./run-log.json"); console.log(JSON.stringify({argv: log.argv, kinds: log.entries.map((entry) => entry.command.kind), hasResult: log.entries.map((entry) => Object.hasOwn(entry, "result"))}, null, 2));'
 * {
 *   "argv": [
 *     "add",
 *     "5000",
 *     "커피",
 *     "--record"
 *   ],
 *   "kinds": [
 *     "readJournal",
 *     "readClock",
 *     "writeJournal",
 *     "print"
 *   ],
 *   "hasResult": [
 *     true,
 *     true,
 *     false,
 *     false
 *   ]
 * }
 *
 * run-log.json 전문은 길어서 구조가 드러나는 부분만 발췌합니다. readJournal과
 * readClock에는 result가 있고, writeJournal과 print에는 result가 없습니다.
 *
 * $ sed -n '1,34p' run-log.json
 * {
 *   "argv": [
 *     "add",
 *     "5000",
 *     "커피",
 *     "--record"
 *   ],
 *   "entries": [
 *     {
 *       "command": {
 *         "kind": "readJournal",
 *         "path": "journal.json"
 *       },
 *       "result": "[\n  {\n    \"kind\": \"simple\",\n    \"id\": \"tx-2026-08-04-1\",\n    ...
 *
 * $ node src/cli.ts add 100 식비 --dry-run
 * [드라이런] journal.json에 쓸 내용:
 * ... 긴 JSON 출력 생략 ...
 *
 * [드라이런] 출력할 내용: 기록 완료. 누적 차변 합계: 35100
 * 종료 코드: 0
 *
 * $ shasum -a 256 journal.json
 * cabb5f4ca7f774ceb43efebca269d914a36c15f9a357284d37cef5d10edf4156  journal.json
 *
 * 드라이런 전 해시도 같은 cabb5f4ca7f774ceb43efebca269d914a36c15f9a357284d37cef5d10edf4156였으므로
 * journal.json은 바뀌지 않았습니다.
 *
 * 플래그 없이 실행하면 기존 실행 인터프리터가 들어가므로 파일에 실제 거래가 하나 늘어납니다.
 *
 * $ node src/cli.ts add 100 식비
 * 기록 완료. 누적 차변 합계: 35100
 * 종료 코드: 0
 *
 * $ node -e 'const j=require("./journal.json"); console.log(j.length); console.log(j.at(-1).memo); console.log(j.at(-1).debit.amountMinor);'
 * 4
 * 식비
 * 100
 *
 * journal.json 복원 뒤:
 *
 * $ wc -c journal.json
 *      745 journal.json
 *
 * $ shasum -a 256 journal.json
 * ecaee8e1653fe2821fa99b8f65c5755523c5e5214743db7a54ae5f7f07366b1d  journal.json
 *
 * $ npx tsc -p .
 * 출력 없음
 * 종료 코드: 0
 *
 * replay 명령을 더한 뒤 같은 흐름을 다시 확인했습니다. 거래 두 개가 든 journal.json에서
 * 커피 거래를 --record로 기록하고, 그 로그를 replay로 재생했습니다.
 *
 * $ node src/cli.ts add 5000 커피 --record
 * 기록 완료. 누적 차변 합계: 35000
 * 종료 코드: 0
 *
 * $ shasum -a 256 journal.json run-log.json
 * cabb5f4ca7f774ceb43efebca269d914a36c15f9a357284d37cef5d10edf4156  journal.json
 * d62b49c41996008ce52016b2c6751956a7322d2c8e7c48b8a74552ba5f835a68  run-log.json
 *
 * $ node src/cli.ts replay
 * [리플레이] journal.json에 쓸 내용:
 * ... 거래 세 개가 든 JSON 출력 생략 ...
 *
 * [리플레이] 출력할 내용: 기록 완료. 누적 차변 합계: 35000
 * 종료 코드: 0
 *
 * $ shasum -a 256 journal.json run-log.json
 * cabb5f4ca7f774ceb43efebca269d914a36c15f9a357284d37cef5d10edf4156  journal.json
 * d62b49c41996008ce52016b2c6751956a7322d2c8e7c48b8a74552ba5f835a68  run-log.json
 *
 * 재생 전후 해시가 같으므로 replay는 두 파일을 바꾸지 않았습니다. 재생이 보여 준 쓸 내용은
 * --record 실행이 실제로 적은 journal.json과 같습니다.
 *
 * $ node src/verify-replay.ts
 * 리플레이 일치
 * 비교한 커맨드 수: 2
 * 종료 코드: 0
 *
 * run-log.json이 없으면 loadRunLog가 무엇을 먼저 해야 하는지 알려 주며 멈춥니다.
 *
 * $ node src/cli.ts replay
 * ... 스택 추적 생략 ...
 * Error: 실행 로그를 찾지 못했습니다. 먼저 node src/cli.ts add ... --record 명령으로 run-log.json 파일을 만드십시오.
 * 종료 코드: 1
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
