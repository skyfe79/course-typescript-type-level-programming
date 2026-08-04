import * as fs from "node:fs";

/*
 * §17 ledger 프로젝트의 이펙트 인터프리터 파일입니다.
 *
 * 실행 위치:
 *   cd projects/ledger
 *   node src/interpreter.ts
 *
 * 타입 검사는 두 위치에서 모두 통과해야 합니다.
 *   저장소 루트: npx tsc --noEmit
 *   projects/ledger: npx tsc -p .
 *
 * 지난 화에서 순수 코어는 실제 일을 바로 하지 않고, 무엇을 할지만 커맨드 값으로
 * 돌려주게 바뀌었습니다. 이 파일은 그 커맨드 중 파일 시스템 이펙트를 실제 호출로
 * 바꾸는 첫 인터프리터입니다.
 *
 * ledger 프로젝트에서 node:fs를 부르는 자리는 이 파일 하나입니다. 다른 파일은
 * 파일을 읽고 쓰는 방법을 알 필요가 없습니다. 도메인과 CLI가 파일 시스템을 직접
 * import하지 않으면, "무엇을 할지"를 정하는 코드와 "바깥세상에 어떻게 적용할지"를
 * 정하는 코드가 한 줄 안에서 섞이지 않습니다.
 */

type ReadJournalCommand = { readonly kind: "readJournal"; readonly path: string };
type WriteJournalCommand = { readonly kind: "writeJournal"; readonly path: string; readonly content: string };

/*
 * 읽기 커맨드는 저널 내용을 문자열로 돌려주고, 쓰기 커맨드는 파일에 기록한 뒤
 * 돌려줄 값이 없습니다. 그래서 반환 타입은 string | void입니다.
 *
 * 지금은 이 모양 그대로 두고, 호출하는 쪽에서 readJournal 결과를 as string으로
 * 받아 사용합니다. 나중에 커맨드 종류와 반환 타입을 더 정교하게 연결할 수 있지만,
 * 이번 화의 초점은 타입 모델링을 끝까지 밀어붙이는 것이 아니라 이펙트 경계가
 * 어디에 놓이는지를 눈으로 확인하는 데 있습니다.
 *
 * readJournal은 파일이 아직 없을 때도 예외를 던지지 않고 빈 저널을 뜻하는 문자열
 * "[]"를 돌려줍니다. 그래서 호출하는 쪽은 "파일이 있는가"를 다시 묻지 않아도 되고,
 * 읽은 문자열을 곧바로 저널 JSON으로 다룰 수 있습니다.
 *
 * 여기서는 readFileSync와 writeFileSync를 씁니다. 이 화의 주제는 비동기 제어 흐름이
 * 아니라 경계의 위치입니다. 동기 API로 두면 파일을 확인하고, 읽고, 쓰는 실행 순서를
 * 위에서 아래로 그대로 따라갈 수 있습니다.
 */
function runFileCommand(cmd: ReadJournalCommand | WriteJournalCommand): string | void {
  if (cmd.kind === "readJournal") {
    if (!fs.existsSync(cmd.path)) return "[]";
    return fs.readFileSync(cmd.path, "utf-8");
  }

  fs.writeFileSync(cmd.path, cmd.content, "utf-8");
}

/*
 * 아래 호출은 다음 스텝들에서 실제 CLI 배선으로 바뀔 임시 확인 코드입니다.
 * 실행 위치는 projects/ledger이고, journal.json은 그 폴더 기준 상대경로입니다.
 *
 * 파일이 없는 첫 실행에서는 첫 출력이 []입니다. 그 다음 writeJournal이 파일을 만들고,
 * 두 번째 출력은 방금 쓴 저널 문자열이 됩니다. 이미 journal.json이 있으면 첫 출력은
 * []가 아니라 기존 파일 내용입니다.
 */
const DEMO_JOURNAL_PATH = "journal.json";

console.log(runFileCommand({ kind: "readJournal", path: DEMO_JOURNAL_PATH }));

runFileCommand({
  kind: "writeJournal",
  path: DEMO_JOURNAL_PATH,
  content: `[
  {"kind":"simple","id":"tx-file-1","date":"2026-08-04","memo":"간식",
   "debit":{"accountId":"acct-food","amountMinor":2500,"currency":"KRW","side":"debit"},
   "credit":{"accountId":"acct-checking","amountMinor":2500,"currency":"KRW","side":"credit"}}
]
`,
});

console.log(runFileCommand({ kind: "readJournal", path: DEMO_JOURNAL_PATH }));

/*
 * 실측 기록
 *
 * 실행 위치: projects/ledger
 *
 * journal.json이 아직 없는 상태에서 처음 실행한 결과입니다.
 *
 * $ node src/interpreter.ts
 * []
 * [
 *   {"kind":"simple","id":"tx-file-1","date":"2026-08-04","memo":"간식",
 *    "debit":{"accountId":"acct-food","amountMinor":2500,"currency":"KRW","side":"debit"},
 *    "credit":{"accountId":"acct-checking","amountMinor":2500,"currency":"KRW","side":"credit"}}
 * ]
 *
 * 종료 코드: 0
 *
 * 첫 줄 []는 파일이 없을 때 runFileCommand가 돌려주는 대체값입니다. 그다음
 * writeJournal이 journal.json을 실제로 만들었고, 두 번째 출력은 그 파일을 다시 읽은
 * 내용입니다. 마지막 빈 줄은 파일 내용이 줄바꿈으로 끝나기 때문에 생깁니다.
 * 같은 명령을 한 번 더 실행하면 파일이 이미 있으므로 첫 출력도 []가 아니라
 * 저널 내용이 됩니다.
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
