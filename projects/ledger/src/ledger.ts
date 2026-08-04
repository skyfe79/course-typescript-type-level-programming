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
 */

// 아직은 단순한 문자열입니다. 다음 화에서 브랜드 타입으로 강화합니다.
type AccountId = string;

/*
 * 아직은 단순한 문자열입니다. 다음 화에서 브랜드 타입으로 강화합니다.
 *
 * 이번 화에서는 날짜 값을 선언만 해 둡니다. 실제 사용은 다음 화 이후
 * 거래 타입을 만들 때 시작합니다. 선언만 있어도 타입 검사는 통과합니다.
 */
type IsoDate = string;

interface Money {
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
   * 방향은 다음 화 이후 거래 타입에서 별도 필드 하나로만 나타냅니다.
   */
  readonly amountMinor: number;

  // 이 실습 저장소의 ledger는 우선 원화만 다룹니다.
  readonly currency: "KRW";
}

function sameMoney(a: Money, b: Money): boolean {
  return a.amountMinor === b.amountMinor && a.currency === b.currency;
}

/*
 * price1과 price2는 서로 다른 자리에서 만든 별개의 객체입니다.
 * 그런데도 sameMoney는 true를 돌려줍니다. 값 객체는 어디서 만들어졌는지가
 * 아니라 데이터만으로 같음을 판정하기 때문입니다.
 */
const price1: Money = { amountMinor: 15000, currency: "KRW" };
const price2: Money = { amountMinor: 15000, currency: "KRW" };

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
  id: "acct-checking",
  name: "체크카드",
  kind: "asset",
  balance: { amountMinor: 500000, currency: "KRW" },
};

const checkingAfter: Account = {
  id: "acct-checking",
  name: "체크카드",
  kind: "asset",
  balance: { amountMinor: 485000, currency: "KRW" },
};

console.log(sameAccount(checkingBefore, checkingAfter));
console.log(sameMoney(checkingBefore.balance, checkingAfter.balance));

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
 * 종료 코드: 0
 *
 * 첫 줄은 값 객체의 값 비교입니다. price1과 price2는 별개의 객체인데도 true입니다.
 * 둘째 줄과 셋째 줄이 이 화의 결론입니다. 같은 계좌의 두 시점을 놓고
 * sameAccount는 true, 그 잔액끼리의 sameMoney는 false를 돌려줍니다.
 * 정체성이 같다는 것과 값이 같다는 것은 서로 다른 질문입니다.
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
