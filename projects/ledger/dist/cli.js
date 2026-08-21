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
 * 이번 화에서는 report 명령도 같은 인터프리터 경계에 연결합니다. add는 파일 쓰기까지
 * 지나가지만, report는 저널을 읽어 순수 포매터가 만든 문자열을 출력 커맨드로 넘깁니다.
 * budget은 아직 표면 명령만 남겨 두고 다음 화들에서 채웁니다.
 */
import { decide, parseJournal, parseTransaction } from "./ledger.js";
import { runCommandDryRun } from "./dry-run-interpreter.js";
import { runCommand } from "./interpreter.js";
import { formatReport } from "./report.js";
import { recordCommand, saveRunLog } from "./replay-interpreter.js";
function parseCommand(argv) {
    const [kind, ...args] = argv;
    /*
     * 보장 2가 아직 들어오지 않은 거친 스텁입니다.
     *
     * 아래 단언은 "argv[0]이 add, report, budget 중 하나다"라고
     * 타입 검사기에게만 말합니다. 실제 문자열을 확인하지는 않습니다.
     * 그래서 nonsense 같은 값도 Command로 만들어져 main까지 넘어갑니다.
     * 다음 단계에서는 이 자리를 진짜 파싱으로 바꿉니다.
     */
    return { kind: kind, args };
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
function toRawTransaction(args, now, sequence) {
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
function runCoreCommand(command, rawJournal, rawInput, run) {
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
function runAdd(args, run) {
    const journalText = run({ kind: "readJournal", path: JOURNAL_PATH });
    const rawJournal = JSON.parse(journalText);
    const journal = parseJournal(rawJournal);
    if (!journal.ok) {
        run({ kind: "print", text: `저널을 읽지 못했습니다: ${journal.error}` });
        process.exitCode = 1;
        return;
    }
    const now = run({ kind: "readClock" });
    const rawInput = toRawTransaction(args, now, rawJournal.length + 1);
    for (const command of decide(journal.value, parseTransaction(rawInput))) {
        runCoreCommand(command, rawJournal, rawInput, run);
    }
}
/*
 * report도 add와 같은 저널 읽기 경로를 지납니다. 차이는 새 거래를 만들거나 시계를
 * 읽지 않는다는 점입니다. JSON 저널을 parseJournal로 검증해 Transaction[]이 된 뒤에야
 * report.ts의 순수 포매터에 넘깁니다.
 *
 * runAdd과 달리 매개변수에 args가 없습니다. report 명령은 아직 위치 인자를 받지 않으므로,
 * 쓰지도 않을 인자를 모양만 맞추려고 받지는 않습니다. 나중에 기간이나 계좌로 거를 인자가
 * 생기면 그때 매개변수를 더합니다.
 */
function runReport(run) {
    const journalText = run({ kind: "readJournal", path: JOURNAL_PATH });
    const rawJournal = JSON.parse(journalText);
    const journal = parseJournal(rawJournal);
    if (!journal.ok) {
        run({ kind: "print", text: `저널을 읽지 못했습니다: ${journal.error}` });
        process.exitCode = 1;
        return;
    }
    run({ kind: "print", text: formatReport(journal.value) });
}
/*
 * 기록용 인터프리터는 runCommand를 감싼 것이므로 --record 실행은 진짜 실행입니다.
 * journal.json도 실제로 바뀌고, 그 뒤에 같은 실행에서 지나간 커맨드를 run-log.json에
 * 저장합니다.
 */
function runAddRecording(args, argv) {
    const entries = [];
    runAdd(args, (cmd) => recordCommand(cmd, entries));
    saveRunLog(RUN_LOG_PATH, { argv, entries });
}
/*
 * parseCommand는 아직 플래그를 모르는 단순한 표면 파서입니다. 그래서 add 인자에
 * 섞여 들어온 --dry-run 같은 플래그는 add 실행 직전에 한 번 걸러 냅니다.
 * 지금은 알 수 없는 --플래그도 조용히 빼고, 실제 거래 인자만 rest에 남깁니다.
 */
function takeFlags(args) {
    const rest = [];
    let dryRun = false;
    let record = false;
    for (const arg of args) {
        if (!arg.startsWith("--")) {
            rest.push(arg);
            continue;
        }
        if (arg === "--dry-run")
            dryRun = true;
        if (arg === "--record")
            record = true;
    }
    return { rest, dryRun, record };
}
function main(command, argv) {
    switch (command.kind) {
        case "add": {
            const { rest, dryRun, record } = takeFlags(command.args);
            if (dryRun) {
                runAdd(rest, runCommandDryRun);
            }
            else if (record) {
                runAddRecording(rest, argv);
            }
            else {
                runAdd(rest, runCommand);
            }
            break;
        }
        case "report": {
            /*
             * report는 저널을 읽기만 하므로 --record는 붙이지 않습니다. --dry-run은 읽기를
             * 그대로 위임하고 출력만 가로채므로, 리포트 본문 앞에 [드라이런] 접두사가 붙습니다.
             */
            const { dryRun } = takeFlags(command.args);
            runReport(dryRun ? runCommandDryRun : runCommand);
            break;
        }
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
            const _exhaustive = command;
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
export { JOURNAL_PATH, RUN_LOG_PATH, parseCommand, runAdd, runReport, takeFlags };
/*
 * 실측 기록
 *
 * 실행 위치: projects/ledger
 *
 * $ shasum -a 256 journal.json run-log.json
 * b2930f45ef3fb61e6baf836804188eb7c85ff3c94225093eb02e18968928542a  journal.json
 * 23290b0d7886aef2d88a091b351883743b556d35463c0fa2ece4240ea79dc42d  run-log.json
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
 *
 * 실행 위치: projects/ledger
 *
 * $ node src/cli.ts report
 * 거래 리포트: 5건
 * 단순 | 2026-08-04 | 점심 | acct-food ← acct-checking | 차변 15000원
 * 단순 | 2026-08-04 | 점심 | acct-food ← acct-checking | 차변 15000원
 * 단순 | 2026-08-04 | 커피 | acct-food ← acct-checking | 차변 5000원
 * 단순 | 2026-08-04 | 간식 | acct-food ← acct-checking | 차변 777원
 * 단순 | 2026-08-04 | 책 | acct-food ← acct-checking | 차변 2500원
 * 차변 합계: 38277원
 * 종료 코드: 0
 *
 * $ node src/cli.ts report --dry-run
 * [드라이런] 출력할 내용: 거래 리포트: 5건
 * 단순 | 2026-08-04 | 점심 | acct-food ← acct-checking | 차변 15000원
 * 단순 | 2026-08-04 | 점심 | acct-food ← acct-checking | 차변 15000원
 * 단순 | 2026-08-04 | 커피 | acct-food ← acct-checking | 차변 5000원
 * 단순 | 2026-08-04 | 간식 | acct-food ← acct-checking | 차변 777원
 * 단순 | 2026-08-04 | 책 | acct-food ← acct-checking | 차변 2500원
 * 차변 합계: 38277원
 * 종료 코드: 0
 *
 * $ node src/ledger.ts
 * (기존 데모 출력 그대로 — 이번 변경 전 출력과 diff로 대조해 한 글자도 다르지 않았습니다.)
 * 종료 코드: 0
 *
 * $ shasum -a 256 journal.json run-log.json
 * b2930f45ef3fb61e6baf836804188eb7c85ff3c94225093eb02e18968928542a  journal.json
 * 23290b0d7886aef2d88a091b351883743b556d35463c0fa2ece4240ea79dc42d  run-log.json
 *
 * 검증 전후 해시가 같으므로 report 실행은 journal.json과 run-log.json을 바꾸지 않았습니다.
 */
