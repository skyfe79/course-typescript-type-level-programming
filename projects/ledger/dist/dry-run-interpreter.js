/*
 * §17 ledger 프로젝트의 드라이런 인터프리터 파일입니다.
 *
 * 실행 위치:
 *   cd projects/ledger
 *   node src/cli.ts add 100 식비 --dry-run
 *
 * 타입 검사는 두 위치에서 모두 통과해야 합니다.
 *   저장소 루트: npx tsc --noEmit
 *   projects/ledger: npx tsc -p .
 *
 * 순수 코어는 드라이런 모드의 존재를 모릅니다. CLI가 같은 Interpreter 모양의
 * 함수를 골라 끼우면, 코어가 돌려준 이펙트 커맨드를 실제 실행할지 로그만 남길지
 * 인터프리터 경계에서 결정합니다.
 *
 * 읽기와 시계는 실제 인터프리터에 위임합니다. 읽기는 바깥세상을 바꾸지 않고,
 * 현재 저널과 현재 시간이 진짜 실행과 같아야 순수 코어의 결정도 같아지기
 * 때문입니다. 쓰기와 출력만 드라이런 로그로 바꿉니다.
 */
import { runCommand } from "./interpreter.js";
/*
 * runCommandDryRun은 §15의 드라이런 예제와 같은 패턴입니다. 같은 커맨드 값을
 * 받지만, 바깥세상을 바꾸는 writeJournal과 print는 실제 실행 대신 무엇을 할지
 * 한국어 로그로 남깁니다.
 */
const runCommandDryRun = (cmd) => {
    switch (cmd.kind) {
        case "readJournal":
        case "readClock":
            return runCommand(cmd);
        case "writeJournal":
            console.log(`[드라이런] ${cmd.path}에 쓸 내용:\n${cmd.content}`);
            break;
        case "print":
            console.log(`[드라이런] 출력할 내용: ${cmd.text}`);
            break;
        default: {
            const _exhaustive = cmd;
            throw new Error("알 수 없는 커맨드");
        }
    }
};
// 이 파일은 최상위 실행문을 두지 않으므로, import 되어도 아무 일도 일어나지 않습니다.
export { runCommandDryRun };
/*
 * 실측 기록
 *
 * 실행 위치: projects/ledger
 *
 * $ node src/dry-run-interpreter.ts
 * 출력 없음
 * 종료 코드: 0
 *
 * 이 파일도 최상위 실행문이 없으므로 직접 실행해도 아무것도 출력하지 않습니다.
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
 * [드라이런] 출력할 내용: 기록 완료. 누적 차변 합계: 30100
 * 종료 코드: 0
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
 * 실행 위치: 저장소 루트
 *
 * $ npx tsc --noEmit
 * 출력 없음
 * 종료 코드: 0
 */
