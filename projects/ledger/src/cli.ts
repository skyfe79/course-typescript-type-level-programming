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

/*
 * 이 파일에도 명령행 표면을 나타내는 Command 타입이 있으므로, 순수 코어의
 * 커맨드는 CoreCommand라는 다른 이름으로 가져옵니다. 하나는 사용자가 친 명령이고,
 * 다른 하나는 실행할 이펙트 계획입니다. import가 생겼으므로 이 파일도 모듈이며,
 * 각 Command 이름은 자기 모듈 안에서만 의미를 갖습니다.
 */

type Command =
  | { kind: "add"; args: string[] }
  | { kind: "report"; args: string[] }
  | { kind: "budget"; args: string[] };

function parseCommand(argv: string[]): Command {
  const [kind, ...args] = argv;

  /*
   * 보장 2가 아직 들어오지 않은 거친 스텁입니다.
   *
   * 아래 단언은 "argv[0]이 add, report, budget 중 하나다"라고
   * 타입 검사기에게만 말합니다. 실제 문자열을 확인하지는 않습니다.
   * 그래서 nonsense 같은 값도 Command로 만들어져 main까지 넘어갑니다.
   * 다음 단계에서는 이 자리를 진짜 파싱으로 바꿉니다.
   */
  return { kind: kind as Command["kind"], args };
}

const JOURNAL_PATH = "journal.json";

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
 * parseCommand는 아직 플래그를 모르는 단순한 표면 파서입니다. 그래서 add 인자에
 * 섞여 들어온 --dry-run 같은 플래그는 add 실행 직전에 한 번 걸러 냅니다.
 * 지금은 알 수 없는 --플래그도 조용히 빼고, 실제 거래 인자만 rest에 남깁니다.
 */
function takeFlags(args: readonly string[]): { rest: string[]; dryRun: boolean } {
  const rest: string[] = [];
  let dryRun = false;

  for (const arg of args) {
    if (!arg.startsWith("--")) {
      rest.push(arg);
      continue;
    }

    if (arg === "--dry-run") dryRun = true;
  }

  return { rest, dryRun };
}

function main(command: Command): void {
  switch (command.kind) {
    case "add": {
      const { rest, dryRun } = takeFlags(command.args);
      runAdd(rest, dryRun ? runCommandDryRun : runCommand);
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
    default: {
      /*
       * 위 세 case가 Command 유니온을 모두 소진하면, 이 위치의 command는
       * never로 좁혀집니다. 그래서 지금은 아래 대입이 컴파일됩니다.
       *
       * 나중에 Command에 네 번째 kind를 더하고 switch 분기를 빠뜨리면,
       * command가 더 이상 never가 아니므로 이 줄이 곧바로 컴파일 오류가 됩니다.
       * 빠진 분기를 타입 검사 단계에서 확인하게 해 주는 완전성 검사입니다.
       */
      const _exhaustive: never = command;
      throw new Error("알 수 없는 명령");
    }
  }
}
main(parseCommand(process.argv.slice(2)));

/*
 * 실측 기록
 *
 * 실행 위치: projects/ledger
 *
 * journal.json이 없는 상태에서 시작합니다. add 명령이 처음으로 실제 파일을 만듭니다.
 *
 * $ node src/cli.ts add 15000 점심
 * 기록 완료. 누적 차변 합계: 15000
 * 종료 코드: 0
 *
 * 이 실행이 journal.json을 만들었습니다. 파일에는 원시 거래 하나가 들어 있고,
 * id는 시계에서 얻은 날짜와 순번으로 만든 tx-2026-08-04-1입니다.
 *
 * 같은 명령을 한 번 더 실행하면, 이번에는 파일에 있던 거래를 먼저 읽어 들이므로
 * 누적 차변 합계가 두 거래의 합으로 늘어납니다.
 *
 * $ node src/cli.ts add 15000 점심
 * 기록 완료. 누적 차변 합계: 30000
 * 종료 코드: 0
 *
 * 이번 단계에서는 거래 두 개가 들어 있는 journal.json에서 시작해 드라이런
 * 인터프리터를 끼워 보았습니다. 긴 JSON 출력 전체는 dry-run-interpreter.ts의
 * 실측 기록에 적고, 여기서는 마지막 출력 줄과 파일 상태만 확인합니다.
 *
 * $ node src/cli.ts add 100 식비 --dry-run | tail -n 1
 * [드라이런] 출력할 내용: 기록 완료. 누적 차변 합계: 30100
 * 종료 코드: 0
 *
 * $ wc -c journal.json
 *      745 journal.json
 *
 * $ shasum -a 256 journal.json
 * ecaee8e1653fe2821fa99b8f65c5755523c5e5214743db7a54ae5f7f07366b1d  journal.json
 *
 * 플래그 없이 실행하면 기존 실행 인터프리터가 들어가므로 파일에 실제 거래가
 * 하나 늘어납니다. 확인한 뒤 journal.json은 원래 내용으로 되돌렸습니다.
 *
 * $ node src/cli.ts add 100 식비
 * 기록 완료. 누적 차변 합계: 30100
 * 종료 코드: 0
 *
 * $ wc -c journal.json
 *     1112 journal.json
 *
 * $ node -e 'const j=require("./journal.json"); console.log(j.length); console.log(j.at(-1).memo); console.log(j.at(-1).debit.amountMinor);'
 * 3
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
 * 금액 자리에 숫자가 아닌 문자열을 넣으면 Number가 NaN을 만들고, makeMoney의 검사가
 * 그 NaN을 거부합니다. 예외가 아니라 값으로 돌아온 실패가 printReport 커맨드와
 * 종료 코드 1의 exit 커맨드로 바뀝니다. journal.json은 바뀌지 않습니다.
 *
 * $ node src/cli.ts add abc 점심
 * 기록 실패: Money.amountMinor must be a non-negative integer (received NaN)
 * 종료 코드: 1
 *
 * $ node src/cli.ts report
 * report 명령은 아직 구현되지 않았습니다.
 * 인자:
 * 종료 코드: 0
 *
 * $ node src/cli.ts budget
 * budget 명령은 아직 구현되지 않았습니다.
 * 인자:
 * 종료 코드: 0
 *
 * 아래 두 명령은 타입 검사를 통과한 코드가 런타임에 죽는 자리입니다.
 * 스텁이 argv[0]을 확인하지 않고 단언만 하므로, 세 명령이 아닌 문자열도
 * 인자가 아예 없는 경우도 그대로 Command가 되어 default 분기까지 내려옵니다.
 * 보장 2가 왜 필요한지를 이 두 줄이 그대로 보여 줍니다.
 * (파일 경로는 실행하는 컴퓨터마다 다르므로 <저장소>로 줄여 적었습니다.)
 *
 * $ node src/cli.ts nonsense
 * file://<저장소>/projects/ledger/src/cli.ts:163
 *       throw new Error("알 수 없는 명령");
 *             ^
 *
 * Error: 알 수 없는 명령
 *     at main (file://<저장소>/projects/ledger/src/cli.ts:163:13)
 *     at file://<저장소>/projects/ledger/src/cli.ts:167:1
 *     at ModuleJob.run (node:internal/modules/esm/module_job:430:25)
 *     at async node:internal/modules/esm/loader:639:26
 *     at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)
 *
 * Node.js v25.8.0
 * 종료 코드: 1
 *
 * $ node src/cli.ts
 * 위와 글자 하나 다르지 않은 오류가 같은 163번째 줄에서 납니다.
 * 인자가 없으면 argv[0]이 undefined인데, 단언이 그것마저 Command["kind"]로
 * 통과시키기 때문입니다.
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
