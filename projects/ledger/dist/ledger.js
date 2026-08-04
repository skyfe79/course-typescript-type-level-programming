/*
 * §17 ledger 프로젝트의 도메인 파일입니다.
 *
 * 실행 위치:
 *   cd projects/ledger
 *   node src/ledger.ts
 *
 * 타입 검사는 두 위치에서 모두 통과해야 합니다.
 *   저장소 루트: npx tsc --noEmit
 *   projects/ledger: npx tsc -p .
 *
 * 저널 항목 하나를 평평한 레코드로 두면, 계좌 잔액이 바뀔 때마다 지나간 거래
 * 기록의 필드까지 함께 손대야 합니다. 한 레코드 안에 성격이 다른 두 종류의
 * 데이터가 섞여 있기 때문입니다.
 *
 *   값 객체 — 데이터 자체가 정체성입니다. 같은 금액을 나타내는 두 값은
 *             어디서 만들어졌든 구별할 필요가 없습니다.
 *   엔티티 — 식별자가 정체성을 정합니다. 이름이나 잔액이 바뀌어도
 *            같은 계좌로 남습니다.
 *
 * 이번 화는 그 둘을 나눠 선언합니다. 값 객체를 먼저 만들고, 엔티티를 그 위에 얹습니다.
 * 이제 AccountId, Money, IsoDate 세 값 타입은 모두 스마트 생성자를 거쳐야만
 * 만들어지며, 각 생성자가 자기 값에 맞는 런타임 검증을 맡습니다.
 * 여기에 거래의 두 모양도 판별 유니온으로 더합니다. 단순 거래와 분할 거래가
 * 어떤 필드를 가져야 하는지 타입 선언만으로 먼저 고정합니다.
 */
/*
 * import.meta.main은 이 파일이 직접 실행된 진입점일 때만 true입니다.
 * 그래서 node src/ledger.ts로 직접 돌리면 지금까지와 똑같이 전부 출력되고,
 * 다른 파일이 이 파일을 import 하면 조용합니다. 지금부터 이 파일은 CLI가
 * 가져다 쓰는 모듈이기도 하므로, 데모 출력과 모듈 import를 구분해야 합니다.
 */
const isDirectRun = import.meta.main;
function demo(...values) {
    if (isDirectRun)
        console.log(...values);
}
function makeAccountId(raw) {
    if (raw.trim().length === 0) {
        throw new Error(`AccountId must not be empty: "${raw}"`);
    }
    return raw;
}
/*
 * 세 스마트 생성자는 같은 원리를 서로 다른 검사로 적용합니다.
 * makeAccountId는 빈 문자열, makeMoney는 정수와 범위, makeIsoDate는 형식만 봅니다.
 * 여기서는 YYYY-MM-DD 모양만 확인합니다. 2026-13-45처럼 달력에 없는 날짜도
 * 형식은 통과하며, 달력 검증은 이번 화의 범위가 아닙니다.
 */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
function makeIsoDate(raw) {
    if (!ISO_DATE_PATTERN.test(raw)) {
        throw new Error(`IsoDate must match YYYY-MM-DD (received "${raw}")`);
    }
    return raw;
}
function makeMoney(amountMinor, currency) {
    if (!Number.isInteger(amountMinor) || amountMinor < 0) {
        throw new Error(`Money.amountMinor must be a non-negative integer (received ${amountMinor})`);
    }
    return { amountMinor, currency };
}
function sameMoney(a, b) {
    return a.amountMinor === b.amountMinor && a.currency === b.currency;
}
/*
 * price1과 price2는 서로 다른 자리에서 만든 별개의 객체입니다.
 * 그런데도 sameMoney는 true를 돌려줍니다. 값 객체는 어디서 만들어졌는지가
 * 아니라 데이터만으로 같음을 판정하기 때문입니다.
 */
const price1 = makeMoney(15000, "KRW");
const price2 = makeMoney(15000, "KRW");
demo(sameMoney(price1, price2));
function sameAccount(a, b) {
    // 정체성 비교입니다. name, kind, balance는 일부러 보지 않습니다.
    return a.id === b.id;
}
/*
 * 같은 계좌의 두 시점입니다. 잔액만 다릅니다.
 *
 * sameAccount는 true, 두 잔액을 sameMoney로 비교하면 false가 나옵니다.
 * 두 함수가 서로 다른 질문에 답하기 때문입니다.
 *   sameAccount — 이 둘은 같은 계좌인가
 *   sameMoney   — 이 둘은 같은 금액인가
 */
const checkingBefore = {
    // AccountId는 생성자를 통과한 문자열만 대입할 수 있습니다.
    id: makeAccountId("acct-checking"),
    name: "체크카드",
    kind: "asset",
    balance: makeMoney(500000, "KRW"),
};
const checkingAfter = {
    // 같은 원시 문자열이어도 순수 string 리터럴은 AccountId가 아닙니다.
    id: makeAccountId("acct-checking"),
    name: "체크카드",
    kind: "asset",
    balance: makeMoney(485000, "KRW"),
};
demo(sameAccount(checkingBefore, checkingAfter));
demo(sameMoney(checkingBefore.balance, checkingAfter.balance));
function describeAccountId(id) {
    return `계좌 ${id}`;
}
const checkingId = makeAccountId("acct-checking");
demo(describeAccountId(checkingId));
// @ts-expect-error - 순수 string은 AccountId 브랜드가 없어 바로 넘길 수 없다
describeAccountId("acct-checking");
const lunchPrice = makeMoney(15000, "KRW");
demo(lunchPrice.amountMinor, lunchPrice.currency);
// @ts-expect-error - 브랜드 없는 평범한 객체 리터럴은 Money 자리에 들어갈 수 없다
const rawPrice = { amountMinor: 15000, currency: "KRW" };
const postedOn = makeIsoDate("2026-08-02");
demo(postedOn);
try {
    makeIsoDate("08/02/2026");
}
catch (err) {
    demo(err.message);
}
function sumMinor(lines) {
    return lines.reduce((total, line) => total + line.amount.amountMinor, 0);
}
/*
 * 생성자는 거래 값을 조립하기 전에 먼저 차변과 대변의 균형을 확인합니다.
 * 균형이 맞을 때만 값을 내놓으므로, 불균형 거래는 만들어진 뒤에 검사해서
 * 거르는 대상이 아니라 애초에 존재할 수 없는 값이 됩니다.
 */
function makeSimpleTransaction(id, date, memo, debit, credit) {
    if (debit.amount.amountMinor !== credit.amount.amountMinor) {
        throw new Error(`Unbalanced transaction ${id}: debit ${debit.amount.amountMinor} != credit ${credit.amount.amountMinor}`);
    }
    return { kind: "simple", id, date, memo, debit, credit };
}
// 분할 거래는 두 쪽의 합계를 sumMinor로 구해 비교합니다.
// 아래에서는 실제 split 값도 이 생성자로 만들어 단순 거래와 같은 방식으로 설명합니다.
function makeSplitTransaction(id, date, memo, debits, credits) {
    const debitTotal = sumMinor(debits);
    const creditTotal = sumMinor(credits);
    if (debitTotal !== creditTotal) {
        throw new Error(`Unbalanced transaction ${id}: debits ${debitTotal} != credits ${creditTotal}`);
    }
    return { kind: "split", id, date, memo, debits, credits };
}
function makeRefundTransaction(id, date, memo, refundOf, debit, credit) {
    if (debit.amount.amountMinor !== credit.amount.amountMinor) {
        throw new Error(`Unbalanced transaction ${id}: debit ${debit.amount.amountMinor} != credit ${credit.amount.amountMinor}`);
    }
    return { kind: "refund", id, date, memo, refundOf, debit, credit };
}
const lunch = makeSimpleTransaction("tx-1", makeIsoDate("2026-08-01"), "점심", { accountId: makeAccountId("acct-food"), amount: makeMoney(15000, "KRW"), side: "debit" }, { accountId: makeAccountId("acct-checking"), amount: makeMoney(15000, "KRW"), side: "credit" });
demo(lunch.kind, lunch.debit.amount.amountMinor);
try {
    makeSimpleTransaction("tx-bad", makeIsoDate("2026-08-01"), "잘못 입력", { accountId: makeAccountId("acct-food"), amount: makeMoney(15000, "KRW"), side: "debit" }, { accountId: makeAccountId("acct-checking"), amount: makeMoney(12000, "KRW"), side: "credit" });
}
catch (err) {
    // tx-bad의 try/catch는 불균형 거래가 애초에 값으로 존재할 수 없음을 실행으로 보여줍니다.
    demo(err.message);
}
function describeTransaction(tx) {
    switch (tx.kind) {
        case "simple":
            return `${tx.date} ${tx.memo}: ${tx.debit.accountId} ← ${tx.credit.accountId} (${tx.debit.amount.amountMinor})`;
        case "split":
            return `${tx.date} ${tx.memo}: 분할 거래 (차변 ${tx.debits.length}줄, 대변 ${tx.credits.length}줄)`;
        case "refund":
            return `${tx.date} ${tx.memo}: 원거래 ${tx.refundOf} 환불 ${tx.debit.accountId} ← ${tx.credit.accountId} (${tx.debit.amount.amountMinor})`;
        default: {
            /*
             * tx를 never에 대입하는 이 줄이 통과한다는 사실 자체가, 이 시점에
             * simple과 split 두 갈래가 전부 처리됐다는 컴파일러의 증명입니다.
             * 나중에 Transaction에 세 번째 갈래가 추가되는데 이 switch에 그 case를
             * 잊으면 tx가 더는 never로 좁혀지지 않아 바로 이 줄에서 컴파일이 막힙니다.
             */
            const _exhaustive = tx;
            return _exhaustive;
        }
    }
}
const groceries = makeSplitTransaction("tx-2", makeIsoDate("2026-08-02"), "장보기", [
    { accountId: makeAccountId("acct-food"), amount: makeMoney(30000, "KRW"), side: "debit" },
    { accountId: makeAccountId("acct-supplies"), amount: makeMoney(12000, "KRW"), side: "debit" },
], [{ accountId: makeAccountId("acct-checking"), amount: makeMoney(42000, "KRW"), side: "credit" }]);
demo(describeTransaction(lunch));
demo(describeTransaction(groceries));
const refund = makeRefundTransaction("tx-5", makeIsoDate("2026-08-03"), "점심 환불", "tx-1", { accountId: makeAccountId("acct-checking"), amount: makeMoney(15000, "KRW"), side: "debit" }, { accountId: makeAccountId("acct-food"), amount: makeMoney(15000, "KRW"), side: "credit" });
demo(describeTransaction(refund));
/*
 * 네 필드의 형태를 먼저 전부 확인합니다. 검사를 통과한 값만 makeAccountId와 makeMoney에
 * 넘겨 EntryLine을 조립하므로, "검증했으니 이제 믿어도 된다"는 별도의 재신뢰 지점이
 * 생기지 않습니다.
 */
function parseEntryLine(raw) {
    if (typeof raw.accountId !== "string" ||
        typeof raw.amountMinor !== "number" ||
        raw.currency !== "KRW" ||
        (raw.side !== "debit" && raw.side !== "credit")) {
        return { ok: false, error: `invalid entry line: ${JSON.stringify(raw)}` };
    }
    return {
        ok: true,
        value: {
            accountId: makeAccountId(raw.accountId),
            amount: makeMoney(raw.amountMinor, raw.currency),
            side: raw.side,
        },
    };
}
/*
 * 형태가 맞는 값은 ok: true 결과로, amountMinor가 빠진 값은 ok: false 결과로 갈립니다.
 */
demo(parseEntryLine({ accountId: "acct-food", amountMinor: 15000, currency: "KRW", side: "debit" }));
demo(parseEntryLine({ accountId: "acct-food", currency: "KRW", side: "debit" }));
/*
 * 먼저 id, date, memo 같은 헤더 필드의 형태를 확인한 뒤 makeIsoDate,
 * parseEntryLine, makeSimpleTransaction 순서로 도메인 값을 조립합니다.
 * 함수 전체가 try/catch로 감싸여 있으므로, 이 호출들 중 무엇이 Error를
 * 던지더라도 예외가 함수 밖으로 새지 않고 { ok: false, error } 값으로
 * 바뀝니다. 이 함수가 예외를 값으로 옮기는 경계입니다.
 *
 * 유니온에 refund 갈래를 더했을 때도 이 함수는 자동으로 깨지지 않았습니다.
 * raw.kind는 아직 unknown이므로, 원시 입력 경계에서 허용할 갈래는 사람이 직접
 * 확인하고 파서 분기로 연결해야 합니다.
 */
function parseTransaction(raw) {
    try {
        if (typeof raw.id !== "string" || typeof raw.date !== "string" || typeof raw.memo !== "string") {
            return { ok: false, error: `invalid transaction header: ${JSON.stringify(raw)}` };
        }
        const date = makeIsoDate(raw.date);
        if (raw.kind === "simple") {
            const debitResult = parseEntryLine(raw.debit);
            const creditResult = parseEntryLine(raw.credit);
            if (!debitResult.ok)
                return debitResult;
            if (!creditResult.ok)
                return creditResult;
            return {
                ok: true,
                value: makeSimpleTransaction(raw.id, date, raw.memo, debitResult.value, creditResult.value),
            };
        }
        if (raw.kind === "refund") {
            if (typeof raw.refundOf !== "string") {
                return { ok: false, error: `invalid refund transaction: ${JSON.stringify(raw)}` };
            }
            const debitResult = parseEntryLine(raw.debit);
            const creditResult = parseEntryLine(raw.credit);
            if (!debitResult.ok)
                return debitResult;
            if (!creditResult.ok)
                return creditResult;
            return {
                ok: true,
                value: makeRefundTransaction(raw.id, date, raw.memo, raw.refundOf, debitResult.value, creditResult.value),
            };
        }
        return { ok: false, error: `unknown transaction kind: ${JSON.stringify(raw.kind)}` };
    }
    catch (err) {
        // 아래층이 던진 오류 메시지를 그대로 error에 싣습니다.
        return { ok: false, error: err.message };
    }
}
/*
 * 균형이 맞는 원시 거래는 ok: true 안에 조립된 Transaction을 담습니다.
 * 금액이 어긋난 원시 거래는 지난 화의 균형 검사가 낸 오류 메시지를 ok: false에
 * 담습니다. 두 경우 모두 예외가 아니라 값으로 전달됩니다.
 */
demo(parseTransaction({
    kind: "simple",
    id: "tx-3",
    date: "2026-08-02",
    memo: "커피",
    debit: { accountId: "acct-food", amountMinor: 4500, currency: "KRW", side: "debit" },
    credit: { accountId: "acct-checking", amountMinor: 4500, currency: "KRW", side: "credit" },
}));
demo(parseTransaction({
    kind: "simple",
    id: "tx-bad-2",
    date: "2026-08-02",
    memo: "금액 불일치",
    debit: { accountId: "acct-food", amountMinor: 4500, currency: "KRW", side: "debit" },
    credit: { accountId: "acct-checking", amountMinor: 4000, currency: "KRW", side: "credit" },
}));
/*
 * 원시 환불 거래도 같은 파서를 지나 검증된 값이 됩니다. 이 분기는 컴파일러가 요구해서
 * 더한 것이 아니라, 유니온을 넓힌 뒤 사람이 직접 찾아 더한 것입니다. 위 주석에 적어 둔
 * 대로 raw.kind는 unknown이라 타입 검사가 이 빠짐을 지적하지 않았습니다.
 */
demo(parseTransaction({
    kind: "refund",
    id: "tx-6",
    date: "2026-08-03",
    memo: "커피 환불",
    refundOf: "tx-3",
    debit: { accountId: "acct-checking", amountMinor: 4500, currency: "KRW", side: "debit" },
    credit: { accountId: "acct-food", amountMinor: 4500, currency: "KRW", side: "credit" },
}));
/*
 * 저널은 거래가 여러 개 들어 있는 배열입니다. 먼저 배열인지 확인하고,
 * 각 원소를 순서대로 parseTransaction에 넘깁니다. 첫 실패를 만나면 그
 * 자리에서 실패 결과를 그대로 돌려주는 단락 구조입니다. 그래서 성공 갈래로
 * 빠져나온 시점에는 다시 검증해야 할 지점이 남지 않습니다.
 */
function parseJournal(raw) {
    if (!Array.isArray(raw)) {
        return { ok: false, error: "journal must be a JSON array of transactions" };
    }
    const transactions = [];
    for (const entry of raw) {
        const result = parseTransaction(entry);
        if (!result.ok)
            return result;
        transactions.push(result.value);
    }
    return { ok: true, value: transactions };
}
/*
 * 실제로는 파일에서 읽어 올 저널 내용을, 여기서는 문자열 하나로 대신 둡니다.
 * 파일 입출력은 이 화의 범위가 아니므로 파싱의 입구만 같은 모양으로 맞춥니다.
 */
const journalJson = `[
  {"kind":"simple","id":"tx-1","date":"2026-08-01","memo":"점심",
   "debit":{"accountId":"acct-food","amountMinor":15000,"currency":"KRW","side":"debit"},
   "credit":{"accountId":"acct-checking","amountMinor":15000,"currency":"KRW","side":"credit"}},
  {"kind":"simple","id":"tx-3","date":"2026-08-02","memo":"커피",
   "debit":{"accountId":"acct-food","amountMinor":4500,"currency":"KRW","side":"debit"},
   "credit":{"accountId":"acct-checking","amountMinor":4500,"currency":"KRW","side":"credit"}}
]`;
/*
 * JSON.parse는 any를 돌려주므로 그 자체로는 아무것도 보장하지 않습니다. 그래서
 * parseJournal의 매개변수를 unknown으로 받아, 형태 확인을 파서 안에서 하게 둡니다.
 * 원시 JSON 문자열 하나가 한 번의 파싱으로 검증된 Transaction[]까지 이어집니다.
 */
const journalResult = parseJournal(JSON.parse(journalJson));
if (journalResult.ok) {
    demo(`loaded ${journalResult.value.length} transactions`);
}
else {
    demo(`parse failed: ${journalResult.error}`);
}
/*
 * decide는 값을 받아 값을 돌려줄 뿐입니다. 함수 몸통 어디에도 fs, console,
 * process가 없으므로 파일 시스템, 시계, 표준출력 없이 이 함수 하나만 따로
 * 호출해 볼 수 있습니다.
 *
 * 두 갈래는 서로 다른 커맨드 목록을 조립합니다. 입력이 ok: false이면 실패를
 * 알리는 printReport와 종료 코드 1의 exit 둘만 돌려줍니다. 입력이 ok: true이면
 * 저널에 추가하는 appendTransaction, 결과를 알리는 printReport, 종료 코드 0의
 * exit 셋을 돌려줍니다.
 *
 * input.ok를 먼저 확인해야 input.value를 읽을 수 있습니다. Result<T>가 판별
 * 유니온이라 좁히기 전에는 성공 갈래의 필드에 손댈 수 없습니다.
 *
 * 누적 차변 합계를 구할 때 split 갈래만 차변이 여러 줄인 debits입니다. 조건을
 * tx.kind === "split"으로 두면 simple과 refund처럼 차변이 한 줄인 갈래가 같은
 * 쪽에 모이고, 새 단일 차변 갈래를 더해도 표현이 불필요하게 길어지지 않습니다.
 *
 * 돌려주는 커맨드들은 아직 계획일 뿐이며, 실제로 아무 일도 일어나지 않습니다.
 */
function decide(existing, input) {
    if (!input.ok) {
        return [
            { kind: "printReport", report: `기록 실패: ${input.error}` },
            { kind: "exit", code: 1 },
        ];
    }
    const updated = [...existing, input.value];
    const debitTotal = sumMinor(updated.flatMap((tx) => (tx.kind === "split" ? tx.debits : [tx.debit])));
    return [
        { kind: "appendTransaction", transaction: input.value },
        { kind: "printReport", report: `기록 완료. 누적 차변 합계: ${debitTotal}` },
        { kind: "exit", code: 0 },
    ];
}
/*
 * 이 확인에는 파일도 시계도 실제 표준출력 경로도 필요하지 않습니다. 값 두 개를
 * 만들어 decide에 넣고 돌아온 배열을 그대로 읽으면, 코어가 무엇을 하려 했는지
 * 전부 드러납니다.
 *
 * 여기서 demo는 이펙트를 실행하려고 쓰는 것이 아닙니다. decide가 돌려준
 * 계획을 눈으로 확인하려고 쓸 뿐입니다. printReport 커맨드 안의 문자열은 아직
 * 화면에 찍히지 않았고, 배열 원소로 들어 있을 뿐입니다.
 *
 * badInput은 파싱을 거치지 않고 손으로 만든 실패 값입니다. 실패 경로를 확인하는 데
 * 실제로 깨진 입력 파일이 필요하지 않다는 뜻입니다.
 */
const noExisting = [];
const goodInput = parseTransaction({
    kind: "simple",
    id: "tx-4",
    date: "2026-08-03",
    memo: "문구",
    debit: { accountId: "acct-supplies", amountMinor: 3200, currency: "KRW", side: "debit" },
    credit: { accountId: "acct-checking", amountMinor: 3200, currency: "KRW", side: "credit" },
});
const badInput = { ok: false, error: "테스트용 실패" };
demo(decide(noExisting, goodInput));
demo(decide(noExisting, badInput));
export { decide, parseJournal, parseTransaction };
/*
 * 실측 기록
 *
 * 실행 위치: projects/ledger
 *
 * $ node src/ledger.ts
 * true
 * true
 * false
 * 계좌 acct-checking
 * 15000 KRW
 * 2026-08-02
 * IsoDate must match YYYY-MM-DD (received "08/02/2026")
 * simple 15000
 * Unbalanced transaction tx-bad: debit 15000 != credit 12000
 * 2026-08-01 점심: acct-food ← acct-checking (15000)
 * 2026-08-02 장보기: 분할 거래 (차변 2줄, 대변 1줄)
 * 2026-08-03 점심 환불: 원거래 tx-1 환불 acct-checking ← acct-food (15000)
 * {
 *   ok: true,
 *   value: {
 *     accountId: 'acct-food',
 *     amount: { amountMinor: 15000, currency: 'KRW' },
 *     side: 'debit'
 *   }
 * }
 * {
 *   ok: false,
 *   error: 'invalid entry line: {"accountId":"acct-food","currency":"KRW","side":"debit"}'
 * }
 * {
 *   ok: true,
 *   value: {
 *     kind: 'simple',
 *     id: 'tx-3',
 *     date: '2026-08-02',
 *     memo: '커피',
 *     debit: { accountId: 'acct-food', amount: [Object], side: 'debit' },
 *     credit: { accountId: 'acct-checking', amount: [Object], side: 'credit' }
 *   }
 * }
 * {
 *   ok: false,
 *   error: 'Unbalanced transaction tx-bad-2: debit 4500 != credit 4000'
 * }
 * {
 *   ok: true,
 *   value: {
 *     kind: 'refund',
 *     id: 'tx-6',
 *     date: '2026-08-03',
 *     memo: '커피 환불',
 *     refundOf: 'tx-3',
 *     debit: { accountId: 'acct-checking', amount: [Object], side: 'debit' },
 *     credit: { accountId: 'acct-food', amount: [Object], side: 'credit' }
 *   }
 * }
 * loaded 2 transactions
 * [
 *   {
 *     kind: 'appendTransaction',
 *     transaction: {
 *       kind: 'simple',
 *       id: 'tx-4',
 *       date: '2026-08-03',
 *       memo: '문구',
 *       debit: [Object],
 *       credit: [Object]
 *     }
 *   },
 *   { kind: 'printReport', report: '기록 완료. 누적 차변 합계: 3200' },
 *   { kind: 'exit', code: 0 }
 * ]
 * [
 *   { kind: 'printReport', report: '기록 실패: 테스트용 실패' },
 *   { kind: 'exit', code: 1 }
 * ]
 * 종료 코드: 0
 *
 * 첫 줄은 값 객체의 값 비교입니다. price1과 price2는 별개의 객체인데도 true입니다.
 * 둘째 줄과 셋째 줄은 같은 계좌의 두 시점을 놓고
 * sameAccount는 true, 그 잔액끼리의 sameMoney는 false를 돌려줍니다.
 * 정체성이 같다는 것과 값이 같다는 것은 서로 다른 질문입니다. 넷째 줄은
 * 검증된 AccountId를 문자열처럼 출력할 수 있음을 보여줍니다. 다섯째 줄은
 * 검증된 Money도 일반 객체처럼 필드를 읽어 출력할 수 있음을 보여줍니다.
 * 여섯째 줄은 형식을 통과한 IsoDate를 그대로 출력한 결과입니다. 일곱째 줄은
 * 형식이 다른 문자열을 makeIsoDate가 거부한 오류 메시지입니다. 여덟째 줄은
 * 균형이 맞는 단순 거래가 생성되어 simple 갈래와 금액을 바로 읽을 수 있음을 보여줍니다.
 * 아홉째 줄은 tx-bad가 생성자 안의 균형 검사를 통과하지 못해 값으로 만들어지지 않았음을
 * try/catch로 확인한 오류 메시지입니다. 열째 줄은 simple 갈래가 describeTransaction의
 * "simple" case를 통과해 날짜, 메모, 차변/대변 계좌, 금액으로 설명되는 모습입니다.
 * 열한째 줄은 makeSplitTransaction으로 만든 균형 잡힌 split 갈래가 분할 거래 설명으로
 * 출력되며, 차변 두 줄과 대변 한 줄을 유니온 좁히기 뒤에 읽을 수 있음을 보여줍니다.
 * 열두째 줄은 이번 화에서 더한 refund 갈래가 원거래 id를 드러내며 설명되는 모습입니다.
 * 그다음 두 객체 출력은 parseEntryLine의 결과입니다. 필드가 모두 맞는 원시 값은 ok: true로
 * EntryLine까지 조립되고, amountMinor가 빠진 원시 값은 ok: false와 오류 문자열로 남습니다.
 * 그다음 세 객체 출력은 parseTransaction의 결과입니다. 균형이 맞는 tx-3은 ok: true
 * Transaction으로 조립되고, 금액이 어긋난 tx-bad-2는 균형 검사 오류 메시지를 담은 ok: false
 * 값으로 전달되며, 세 번째 tx-6은 원시 refund 입력이 이번 화에서 더한 파서 분기를 지나
 * 검증된 Transaction 값이 된 결과입니다. loaded 2 transactions 줄은 원시 JSON 배열 하나가 parseJournal을 지나
 * 두 개의 검증된 Transaction 값으로 이어졌음을 보여줍니다. 그다음 두 배열 출력은
 * decide의 성공 경로와 실패 경로가 각각 돌려준 커맨드 목록입니다. 파일을 만들거나
 * 화면에 결과를 찍는 실제 동작은 이 파일에서 일어나지 않습니다.
 *
 * 위 출력은 이 파일을 직접 실행했을 때만 나옵니다. cli.ts처럼 다른 파일이 이 파일을
 * import 하면 demo가 조용해지므로, CLI 출력 앞에 이 데모가 섞이지 않습니다.
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
