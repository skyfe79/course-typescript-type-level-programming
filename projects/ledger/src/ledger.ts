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
 * AccountId는 문자열처럼 출력하고 비교할 수 있지만, 아무 문자열이나 계좌
 * 식별자로 받을 수는 없도록 브랜드를 붙입니다.
 */
declare const accountIdBrand: unique symbol;
type AccountId = string & { readonly [accountIdBrand]: true };

function makeAccountId(raw: string): AccountId {
  if (raw.trim().length === 0) {
    throw new Error(`AccountId must not be empty: "${raw}"`);
  }

  return raw as AccountId;
}

/*
 * IsoDate는 문자열처럼 출력하고 저장할 수 있지만, YYYY-MM-DD 형식을 확인한
 * 문자열만 날짜 값으로 다루도록 브랜드를 붙입니다.
 *
 * 이제 Transaction의 date 필드가 이 타입을 실제 날짜 값으로 사용합니다.
 * 생성자는 어떤 문자열을 통과시키고 거부하는지 런타임에서 계속 보여줍니다.
 */
declare const isoDateBrand: unique symbol;
type IsoDate = string & { readonly [isoDateBrand]: true };

/*
 * 세 스마트 생성자는 같은 원리를 서로 다른 검사로 적용합니다.
 * makeAccountId는 빈 문자열, makeMoney는 정수와 범위, makeIsoDate는 형식만 봅니다.
 * 여기서는 YYYY-MM-DD 모양만 확인합니다. 2026-13-45처럼 달력에 없는 날짜도
 * 형식은 통과하며, 달력 검증은 이번 화의 범위가 아닙니다.
 */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function makeIsoDate(raw: string): IsoDate {
  if (!ISO_DATE_PATTERN.test(raw)) {
    throw new Error(`IsoDate must match YYYY-MM-DD (received "${raw}")`);
  }

  return raw as IsoDate;
}

declare const moneyBrand: unique symbol;
type Money = {
  /*
   * 원 단위 정수를 저장합니다.
   *
   * 금액을 15000.5처럼 소수로 들고 다니면 이진 부동소수점 표현 때문에
   * 계산 과정에서 미세한 오차가 끼어들 수 있습니다. 그래서 돈은 항상
   * 최소 단위인 원을 정수로 저장합니다.
   *
   * amountMinor는 항상 0 이상입니다. 금액에 음수를 허용하면 같은 경제적
   * 사실 하나를 "음수 대변"과 "양수 차변" 두 가지 방식으로 똑같이 나타낼 수
   * 있어, 실제로 필요한 상태 수보다 표현 가능한 상태 수가 두 배로 불어납니다.
   * 방향은 EntryLine.side 필드 하나로만 나타냅니다.
   *
   * 이제 makeMoney가 이 결정을 실제 런타임 검증으로 강제합니다.
   */
  readonly amountMinor: number;

  // 이 실습 저장소의 ledger는 우선 원화만 다룹니다.
  readonly currency: "KRW";
} & { readonly [moneyBrand]: true };

function makeMoney(amountMinor: number, currency: "KRW"): Money {
  if (!Number.isInteger(amountMinor) || amountMinor < 0) {
    throw new Error(`Money.amountMinor must be a non-negative integer (received ${amountMinor})`);
  }

  return { amountMinor, currency } as Money;
}

function sameMoney(a: Money, b: Money): boolean {
  return a.amountMinor === b.amountMinor && a.currency === b.currency;
}

/*
 * price1과 price2는 서로 다른 자리에서 만든 별개의 객체입니다.
 * 그런데도 sameMoney는 true를 돌려줍니다. 값 객체는 어디서 만들어졌는지가
 * 아니라 데이터만으로 같음을 판정하기 때문입니다.
 */
const price1: Money = makeMoney(15000, "KRW");
const price2: Money = makeMoney(15000, "KRW");

console.log(sameMoney(price1, price2));

/*
 * 여기부터는 엔티티입니다.
 *
 * 엔티티는 값 객체와 다르게 식별자가 정체성을 정합니다. 이름이나 잔액처럼
 * 시간이 지나며 바뀌는 데이터가 있어도, id가 같으면 같은 계좌로 봅니다.
 */

type AccountKind = "asset" | "expense" | "budget";

interface Account {
  // 식별자입니다. 계좌의 정체성은 이 값 하나로만 정해집니다.
  readonly id: AccountId;

  // 이름은 사용자가 나중에 바꿀 수 있는 표시용 상태입니다.
  name: string;

  // 계좌의 분류도 도메인 정책에 따라 바뀔 수 있는 상태입니다.
  kind: AccountKind;

  // 잔액은 입출금과 거래 기록에 따라 시간이 지나며 바뀌는 상태입니다.
  balance: Money;
}

function sameAccount(a: Account, b: Account): boolean {
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
const checkingBefore: Account = {
  // AccountId는 생성자를 통과한 문자열만 대입할 수 있습니다.
  id: makeAccountId("acct-checking"),
  name: "체크카드",
  kind: "asset",
  balance: makeMoney(500000, "KRW"),
};

const checkingAfter: Account = {
  // 같은 원시 문자열이어도 순수 string 리터럴은 AccountId가 아닙니다.
  id: makeAccountId("acct-checking"),
  name: "체크카드",
  kind: "asset",
  balance: makeMoney(485000, "KRW"),
};

console.log(sameAccount(checkingBefore, checkingAfter));
console.log(sameMoney(checkingBefore.balance, checkingAfter.balance));

function describeAccountId(id: AccountId): string {
  return `계좌 ${id}`;
}

const checkingId = makeAccountId("acct-checking");
console.log(describeAccountId(checkingId));

// @ts-expect-error - 순수 string은 AccountId 브랜드가 없어 바로 넘길 수 없다
describeAccountId("acct-checking");

const lunchPrice = makeMoney(15000, "KRW");
console.log(lunchPrice.amountMinor, lunchPrice.currency);

// @ts-expect-error - 브랜드 없는 평범한 객체 리터럴은 Money 자리에 들어갈 수 없다
const rawPrice: Money = { amountMinor: 15000, currency: "KRW" };

const postedOn = makeIsoDate("2026-08-02");
console.log(postedOn);

try {
  makeIsoDate("08/02/2026");
} catch (err) {
  console.log((err as Error).message);
}

/*
 * 여기부터는 거래입니다.
 *
 * 저널 한 줄은 어느 계좌에서 얼마가 어느 방향으로 움직였는지를 나타냅니다.
 * 금액은 항상 0 이상이므로(Money 주석 참고) 방향은 side 필드가 따로 맡습니다.
 */
type EntryLine = {
  readonly accountId: AccountId;
  readonly amount: Money;
  readonly side: "debit" | "credit";
};

/*
 * 거래는 두 모양뿐입니다. 한 줄씩 맞바꾸는 단순 거래와, 여러 줄로 나뉜 분할
 * 거래입니다. 두 모양을 kind 판별자로 구분하고, 각 갈래에 이름을 붙여 둡니다.
 * 갈래에 이름이 있으면 다음 절의 생성자가 자기 갈래 타입을 그대로 돌려줄 수
 * 있고, 호출 쪽은 유니온 좁히기 없이 그 갈래 전용 필드를 바로 읽습니다.
 */
type SimpleTransaction = {
  readonly kind: "simple";
  readonly id: string;
  readonly date: IsoDate;
  readonly memo: string;
  readonly debit: EntryLine;
  readonly credit: EntryLine;
};

type SplitTransaction = {
  readonly kind: "split";
  readonly id: string;
  readonly date: IsoDate;
  readonly memo: string;
  readonly debits: readonly EntryLine[];
  readonly credits: readonly EntryLine[];
};

type Transaction = SimpleTransaction | SplitTransaction;

function sumMinor(lines: readonly EntryLine[]): number {
  return lines.reduce((total, line) => total + line.amount.amountMinor, 0);
}

/*
 * 생성자는 거래 값을 조립하기 전에 먼저 차변과 대변의 균형을 확인합니다.
 * 균형이 맞을 때만 값을 내놓으므로, 불균형 거래는 만들어진 뒤에 검사해서
 * 거르는 대상이 아니라 애초에 존재할 수 없는 값이 됩니다.
 */
function makeSimpleTransaction(
  id: string,
  date: IsoDate,
  memo: string,
  debit: EntryLine,
  credit: EntryLine,
): SimpleTransaction {
  if (debit.amount.amountMinor !== credit.amount.amountMinor) {
    throw new Error(
      `Unbalanced transaction ${id}: debit ${debit.amount.amountMinor} != credit ${credit.amount.amountMinor}`,
    );
  }

  return { kind: "simple", id, date, memo, debit, credit };
}

// 분할 거래는 두 쪽의 합계를 sumMinor로 구해 비교합니다.
// 아래에서는 실제 split 값도 이 생성자로 만들어 단순 거래와 같은 방식으로 설명합니다.
function makeSplitTransaction(
  id: string,
  date: IsoDate,
  memo: string,
  debits: readonly EntryLine[],
  credits: readonly EntryLine[],
): SplitTransaction {
  const debitTotal = sumMinor(debits);
  const creditTotal = sumMinor(credits);

  if (debitTotal !== creditTotal) {
    throw new Error(`Unbalanced transaction ${id}: debits ${debitTotal} != credits ${creditTotal}`);
  }

  return { kind: "split", id, date, memo, debits, credits };
}

const lunch = makeSimpleTransaction(
  "tx-1",
  makeIsoDate("2026-08-01"),
  "점심",
  { accountId: makeAccountId("acct-food"), amount: makeMoney(15000, "KRW"), side: "debit" },
  { accountId: makeAccountId("acct-checking"), amount: makeMoney(15000, "KRW"), side: "credit" },
);
console.log(lunch.kind, lunch.debit.amount.amountMinor);

try {
  makeSimpleTransaction(
    "tx-bad",
    makeIsoDate("2026-08-01"),
    "잘못 입력",
    { accountId: makeAccountId("acct-food"), amount: makeMoney(15000, "KRW"), side: "debit" },
    { accountId: makeAccountId("acct-checking"), amount: makeMoney(12000, "KRW"), side: "credit" },
  );
} catch (err) {
  // tx-bad의 try/catch는 불균형 거래가 애초에 값으로 존재할 수 없음을 실행으로 보여줍니다.
  console.log((err as Error).message);
}

function describeTransaction(tx: Transaction): string {
  switch (tx.kind) {
    case "simple":
      return `${tx.date} ${tx.memo}: ${tx.debit.accountId} ← ${tx.credit.accountId} (${tx.debit.amount.amountMinor})`;
    case "split":
      return `${tx.date} ${tx.memo}: 분할 거래 (차변 ${tx.debits.length}줄, 대변 ${tx.credits.length}줄)`;
    default: {
      /*
       * tx를 never에 대입하는 이 줄이 통과한다는 사실 자체가, 이 시점에
       * simple과 split 두 갈래가 전부 처리됐다는 컴파일러의 증명입니다.
       * 나중에 Transaction에 세 번째 갈래가 추가되는데 이 switch에 그 case를
       * 잊으면 tx가 더는 never로 좁혀지지 않아 바로 이 줄에서 컴파일이 막힙니다.
       */
      const _exhaustive: never = tx;
      return _exhaustive;
    }
  }
}

const groceries = makeSplitTransaction(
  "tx-2",
  makeIsoDate("2026-08-02"),
  "장보기",
  [
    { accountId: makeAccountId("acct-food"), amount: makeMoney(30000, "KRW"), side: "debit" },
    { accountId: makeAccountId("acct-supplies"), amount: makeMoney(12000, "KRW"), side: "debit" },
  ],
  [{ accountId: makeAccountId("acct-checking"), amount: makeMoney(42000, "KRW"), side: "credit" }],
);

console.log(describeTransaction(lunch));
console.log(describeTransaction(groceries));

export {};

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
 *
 * $ npx tsc -p .
 * 출력 없음
 * 종료 코드: 0
 *
 * $ node src/cli.ts add 100 groceries
 * add 명령은 아직 구현되지 않았습니다.
 * 인자: 100, groceries
 * 종료 코드: 0
 *
 * 실행 위치: 저장소 루트
 *
 * $ npx tsc --noEmit
 * 출력 없음
 * 종료 코드: 0
 */
