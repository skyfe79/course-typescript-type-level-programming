/*
 * §17 ledger 프로젝트의 거래 리포트 포매터 파일입니다.
 *
 * 실행 위치:
 *   cd projects/ledger
 *   node src/cli.ts report
 *
 * 타입 검사는 두 위치에서 모두 통과해야 합니다.
 *   저장소 루트: npx tsc --noEmit
 *   projects/ledger: npx tsc -p .
 *
 * 이 파일은 Transaction 값을 사람이 읽을 문자열로 바꾸는 순수 포매터만 둡니다.
 * 파일 읽기, 시계, 표준출력 같은 이펙트는 §17에서 세운 경계대로 interpreter.ts를
 * 지나야 합니다. 그래서 여기서는 node:fs, Date, console을 부르지 않고, 이미 검증된
 * 거래 값을 받아 문자열을 만들어 돌려주기만 합니다.
 */
/*
 * 거래 하나의 차변 금액을 구하는 자리는 이 함수 하나입니다. simple은 차변이 한 줄이라
 * 그 줄의 금액이 곧 합계이고, split은 여러 줄이라 합을 구해야 합니다. 아래 포매터도
 * 이 함수를 불러 쓰므로, 같은 덧셈이 파일 안에 두 번 적히지 않습니다.
 *
 * 이 파일에는 완전성 검사가 두 번 나옵니다. 같은 것을 두 번 검사하는 것이 아니라,
 * 갈래마다 답이 달라지는 질문이 둘이기 때문입니다. 여기서 묻는 것은 "차변이 얼마인가"이고,
 * 아래 formatTransaction이 묻는 것은 "이 거래를 어떤 문장으로 적을 것인가"입니다.
 */
function sumDebitMinor(tx) {
    switch (tx.kind) {
        case "simple":
            return tx.debit.amount.amountMinor;
        case "split":
            return tx.debits.reduce((total, line) => total + line.amount.amountMinor, 0);
        case "refund":
            return tx.debit.amount.amountMinor;
        default: {
            /*
             * 이 줄이 컴파일된다는 사실 자체가, 지금 이 시점에 Transaction의 모든 갈래가
             * 위 switch에서 처리됐다는 컴파일러의 증명입니다. 나중에 거래 유니온에 새
             * kind가 추가되면 tx가 never로 좁혀지지 않아 이 자리에서 타입 오류가 납니다.
             */
            const _exhaustive = tx;
            return _exhaustive;
        }
    }
}
function formatTransaction(tx) {
    switch (tx.kind) {
        case "simple":
            return [
                "단순",
                tx.date,
                tx.memo,
                `${tx.debit.accountId} ← ${tx.credit.accountId}`,
                `차변 ${sumDebitMinor(tx)}원`,
            ].join(" | ");
        case "split":
            return [
                "분할",
                tx.date,
                tx.memo,
                `차변 ${tx.debits.length}줄 / 대변 ${tx.credits.length}줄`,
                `차변 합계 ${sumDebitMinor(tx)}원`,
            ].join(" | ");
        case "refund":
            return [
                "환불",
                tx.date,
                tx.memo,
                `원거래 ${tx.refundOf}`,
                `${tx.debit.accountId} ← ${tx.credit.accountId}`,
                `차변 ${sumDebitMinor(tx)}원`,
            ].join(" | ");
        default: {
            /*
             * const _exhaustive: never = tx가 컴파일된다는 사실은 "이 시점의 Transaction
             * 유니온에서 simple과 split 두 갈래가 전부 처리됐다"는 뜻입니다. 다음 화에서
             * 새 갈래를 더하고 이 switch를 고치지 않으면, 바로 이 줄이 빠진 case를 알려줍니다.
             */
            const _exhaustive = tx;
            return _exhaustive;
        }
    }
}
function formatReport(transactions) {
    if (transactions.length === 0) {
        return "거래가 없습니다. 리포트할 저널 항목이 없습니다.";
    }
    const debitTotalMinor = transactions.reduce((total, tx) => total + sumDebitMinor(tx), 0);
    return [
        `거래 리포트: ${transactions.length}건`,
        ...transactions.map((tx) => formatTransaction(tx)),
        `차변 합계: ${debitTotalMinor}원`,
    ].join("\n");
}
export { formatReport, formatTransaction };
/*
 * 실측 기록
 *
 * 이번 스텝에서는 Transaction에 refund 갈래만 먼저 더하고, 그 갈래를 읽는 코드는
 * 하나도 고치지 않은 채로 타입 검사를 한 번 실패시켰습니다. 그때 컴파일러가 무엇을
 * 잡고 무엇을 잡지 못하는지가 이 화의 요지입니다.
 *
 * 아래 출력은 지금 이 저장소에서 그대로 재현할 수 있습니다. 이 파일의 두 refund case와
 * ledger.ts의 describeTransaction refund case를 지우고, decide의 조건을 예전처럼
 * tx.kind === "simple" ? [tx.debit] : tx.debits로 되돌린 뒤 타입 검사를 돌리면 됩니다.
 * 줄 번호는 그렇게 되돌린 상태 기준입니다.
 *
 * 실행 위치: projects/ledger
 *
 * $ npx tsc -p .
 * src/ledger.ts(354,13): error TS2322: Type 'RefundTransaction' is not assignable to type 'never'.
 * src/ledger.ts(653,69): error TS2339: Property 'debits' does not exist on type 'RefundTransaction | SplitTransaction'.
 *   Property 'debits' does not exist on type 'RefundTransaction'.
 * src/report.ts(41,13): error TS2322: Type 'RefundTransaction' is not assignable to type 'never'.
 * src/report.ts(71,13): error TS2322: Type 'RefundTransaction' is not assignable to type 'never'.
 * 종료 코드: 1
 *
 * 실행 위치: 저장소 루트
 *
 * $ npx tsc --noEmit
 * projects/ledger/src/ledger.ts(354,13): error TS2322: Type 'RefundTransaction' is not assignable to type 'never'.
 * projects/ledger/src/ledger.ts(653,69): error TS2339: Property 'debits' does not exist on type 'RefundTransaction | SplitTransaction'.
 *   Property 'debits' does not exist on type 'RefundTransaction'.
 * projects/ledger/src/report.ts(41,13): error TS2322: Type 'RefundTransaction' is not assignable to type 'never'.
 * projects/ledger/src/report.ts(71,13): error TS2322: Type 'RefundTransaction' is not assignable to type 'never'.
 * 종료 코드: 1
 *
 * 오류가 네 개인데, 유니온을 읽는 자리는 그보다 많습니다. 그 차이가 아래 분류입니다.
 *
 * (가) 완전성 검사가 잡은 자리:
 * ledger.ts의 describeTransaction, report.ts의 sumDebitMinor와 formatTransaction입니다.
 * 세 곳 모두 default 절의 const _exhaustive: never = tx 대입이 refund 갈래를 만나
 * 깨졌습니다.
 *
 * (나) 완전성 검사가 아니라 다른 이유로 잡힌 자리:
 * ledger.ts의 decide에서 누적 차변 합계를 구하는 삼항 표현입니다. simple이 아니면
 * 모두 debits를 가진다고 쓴 탓에, simple이 아닌 갈래가 split | refund로 넓어지고
 * refund에는 debits가 없다는 속성 접근 오류가 났습니다.
 *
 * (다) 아무 오류도 나지 않은 자리:
 * ledger.ts의 parseTransaction입니다. raw.kind의 타입은 Transaction["kind"]가 아니라
 * unknown이므로, 유니온에 refund가 추가되어도 컴파일러는 이 파서가 새 갈래를 빠뜨렸다고
 * 말하지 않았습니다. 원시 입력이 들어오는 경계는 타입 검사가 모든 빠짐을 대신 잡아 주지
 * 않으므로 사람이 허용할 kind와 파싱 분기를 직접 갱신해야 합니다.
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
 * 기존 데모 출력 순서는 그대로이고, describeTransaction(groceries) 뒤에 환불 설명과
 * 원시 refund 파싱 결과 두 출력만 새로 늘었습니다. 전체 출력은 ledger.ts의 실측 기록에
 * 적어 두었습니다.
 * 종료 코드: 0
 *
 * journal.json을 임시 복사본으로 보관한 뒤 원본에 refund 거래 한 건을 손으로 추가하고
 * 리포트를 실행했습니다.
 *
 * $ node src/cli.ts report
 * 거래 리포트: 6건
 * 단순 | 2026-08-04 | 점심 | acct-food ← acct-checking | 차변 15000원
 * 단순 | 2026-08-04 | 점심 | acct-food ← acct-checking | 차변 15000원
 * 단순 | 2026-08-04 | 커피 | acct-food ← acct-checking | 차변 5000원
 * 단순 | 2026-08-04 | 간식 | acct-food ← acct-checking | 차변 777원
 * 단순 | 2026-08-04 | 책 | acct-food ← acct-checking | 차변 2500원
 * 환불 | 2026-08-04 | 책 환불 | 원거래 tx-2026-08-04-5 | acct-checking ← acct-food | 차변 2500원
 * 차변 합계: 40777원
 * 종료 코드: 0
 *
 * $ shasum -a 256 journal.json run-log.json
 * b2930f45ef3fb61e6baf836804188eb7c85ff3c94225093eb02e18968928542a  journal.json
 * 23290b0d7886aef2d88a091b351883743b556d35463c0fa2ece4240ea79dc42d  run-log.json
 *
 * 복사본으로 되돌린 뒤 해시가 원래 값과 같으므로 journal.json과 run-log.json은
 * 영구히 바뀌지 않았습니다.
 */
