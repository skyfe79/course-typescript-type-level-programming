/*
 * 이 파일은 ledger 패키지를 만드는 쪽이 아니라, 패키지를 가져다 쓰는 쪽
 * 곧 컨슈머 자리에 서서 방금 배포 모양을 갖춘 ledger를 확인하는 작은 파일입니다.
 *
 * 배포물 자체가 아니라 검증용 파일이므로 src 밖에 둡니다. projects/ledger의
 * package.json이 files: ["dist"]로 배포 대상을 dist로만 제한하기 때문에, 이 파일은
 * 패키지를 설치하는 사람에게 함께 담기지 않습니다. 여기서는 "우리가 만든 패키지를
 * 남의 프로젝트처럼 가져다 쓰면 타입과 실행이 제대로 이어지는가"만 확인합니다.
 *
 * 실행 위치와 명령:
 *   cd projects/ledger
 *   node consumer-check.ts
 *
 * 타입 검사:
 *   저장소 루트에서 npx tsc --noEmit
 *
 * 아래 import가 상대 경로가 아니라 패키지 이름 "ledger"를 쓰는 점이 핵심입니다.
 * 그래야 타입 검사는 package.json의 types 필드를 지나 dist/index.d.ts를 읽고,
 * 실행은 main 필드를 지나 dist/index.js를 읽습니다. 상대 경로로 ./src/index.ts나
 * ./dist/index.js를 직접 가리키면, 이번 화에서 만든 패키지 표면을 실제로 확인하지
 * 못합니다.
 */
import { formatReport, formatTransaction, parseTransaction } from "ledger";
import type { RawTransaction, Transaction } from "ledger";

const rawTransaction: RawTransaction = {
  kind: "simple",
  id: "tx-consumer-check-1",
  date: "2026-08-05",
  memo: "컨슈머 확인용 식비",
  debit: {
    accountId: "acct-food",
    amountMinor: 15000,
    currency: "KRW",
    side: "debit",
  },
  credit: {
    accountId: "acct-checking",
    amountMinor: 15000,
    currency: "KRW",
    side: "credit",
  },
};

const parsed = parseTransaction(rawTransaction);

/*
 * parseTransaction의 결과는 Result<Transaction>입니다. ok가 true인지 확인하기 전에는
 * 성공 갈래의 value를 읽을 수 없습니다. 이 if 문이 판별 유니온을 좁혀 주기 때문에,
 * 성공 갈래 안에서만 parsed.value가 Transaction으로 보입니다.
 */
if (parsed.ok) {
  const transaction = parsed.value;

  console.log(formatTransaction(transaction));
  console.log(formatReport([transaction]));

  /*
   * 실험 1 - 유니온에 없는 갈래
   *
   * 아래 줄 맨 앞의 "// "를 지우면, 이미 파싱해 얻은 Transaction의 kind를
   * "expense"와 비교하게 됩니다. 하지만 공개 선언 파일이 Transaction을
   * "simple" | "split" | "refund" 판별 유니온으로 그대로 전해 주었기 때문에,
   * 컨슈머 쪽에서도 유니온에 없는 갈래를 받을 수 없습니다.
   *
   * 실측: 저장소 루트에서 npx tsc --noEmit
   *   projects/ledger/consumer-check.ts(71,7): error TS2367: This comparison appears to be
   *     unintentional because the types '"refund" | "simple" | "split"' and '"expense"' have no overlap.
   *   종료 코드 1. 유니온 세 갈래가 선언 파일에 그대로 실려 있어 나오는 오류입니다.
   */
  // if (transaction.kind === "expense") console.log(transaction);
} else {
  console.log(`거래 파싱 실패: ${parsed.error}`);
}

/*
 * 실험 2 - 브랜드는 패키지 경계를 넘어서도 살아 있다
 *
 * 아래 코드 줄들의 맨 앞 "// "를 지우면, Transaction 타입의 값을 객체 리터럴로
 * 직접 만들게 됩니다. 겉보기에는 date가 문자열이고 amount가 금액 객체처럼 보여도,
 * 실제 타입은 IsoDate와 Money 브랜드를 요구합니다. AccountId도 마찬가지로 아무
 * 문자열이나 받을 수 없습니다.
 *
 * 이 말은 §17 내내 지켜 온 "잘못된 상태를 표현할 수 없게 만들기"가 컴파일된
 * 패키지 경계를 건너서도 유지된다는 뜻입니다. 컨슈머가 거래를 만들고 싶다면
 * 브랜드 타입을 직접 흉내 내지 말고, RawTransaction을 parseTransaction에 넘겨
 * 런타임 검증과 스마트 생성자를 통과해야 합니다.
 *
 * 실측: 저장소 루트에서 npx tsc --noEmit — 오류 5건, 종료 코드 1.
 *   consumer-check.ts(103,3): error TS2322: Type 'string' is not assignable to type 'IsoDate'.
 *     Type 'string' is not assignable to type '{ readonly [isoDateBrand]: true; }'.
 *   consumer-check.ts(106,5): error TS2322: Type 'string' is not assignable to type 'AccountId'.
 *   consumer-check.ts(107,5): error TS2322: Type '{ amountMinor: number; currency: "KRW"; }' is not
 *     assignable to type 'Money'. Property '[moneyBrand]' is missing …
 *   대변 쪽 accountId와 amount에서 같은 오류가 한 번씩 더 납니다.
 *
 *   브랜드는 unique symbol로 만든 자리라 손으로 흉내 낼 수 없습니다. 컴파일된 패키지를
 *   건너온 뒤에도 그 성질이 그대로 남아 있다는 것이 이 다섯 줄로 확인됩니다.
 */
// const handwrittenTransaction: Transaction = {
//   kind: "simple",
//   id: "tx-handwritten",
//   date: "2026-08-05",
//   memo: "직접 만든 거래",
//   debit: {
//     accountId: "acct-food",
//     amount: { amountMinor: 15000, currency: "KRW" },
//     side: "debit",
//   },
//   credit: {
//     accountId: "acct-checking",
//     amount: { amountMinor: 15000, currency: "KRW" },
//     side: "credit",
//   },
// };

/*
 * 실험 3 - 배럴이 정한 경계
 *
 * 아래 줄 맨 앞의 "// "를 지우면, ledger 패키지에서 runAdd를 가져오려고 합니다.
 * runAdd는 cli.ts 안의 내부 함수이고 src/index.ts 배럴이 내보내지 않았습니다.
 * 그러므로 dist/index.d.ts에도 없고, 컨슈머가 보는 패키지 표면에도 없습니다.
 *
 * 실측: 저장소 루트에서 npx tsc --noEmit
 *   consumer-check.ts(129,10): error TS2305: Module '"ledger"' has no exported member 'runAdd'.
 *   종료 코드 1. runAdd는 dist/cli.js 안에 그대로 컴파일돼 있지만, 배럴이 내보내지 않았으므로
 *   패키지 표면에는 없습니다. 무엇을 공개하지 않을지도 배럴이 정합니다.
 */
// import { runAdd } from "ledger";

/*
 * 실측 기록
 *
 * 실행 위치: projects/ledger
 *
 * $ node consumer-check.ts
 *   단순 | 2026-08-05 | 컨슈머 확인용 식비 | acct-food ← acct-checking | 차변 15000원
 *   거래 리포트: 1건
 *   단순 | 2026-08-05 | 컨슈머 확인용 식비 | acct-food ← acct-checking | 차변 15000원
 *   차변 합계: 15000원
 *
 * 빌드된 패키지로 실행한 결과가 소스 실행과 같은지
 *   $ node dist/cli.js report  와  $ node src/cli.ts report 의 출력을 diff로 대조 — 차이 없음.
 *   $ node dist/cli.js add 1200 커피 --dry-run 도 저널에 쓸 내용과 [드라이런] 접두사를 그대로
 *   내놓고, journal.json 해시는 바뀌지 않았습니다.
 *
 * 실험 1·2·3의 컴파일 오류: 각 실험 블록의 실측 줄에 적어 두었습니다.
 *   줄 번호는 그 실험 하나만 주석에서 되살린 상태 기준입니다.
 *
 * 커밋된 이 상태에서 저장소 루트 npx tsc --noEmit — 0 오류, 종료 코드 0.
 *   실험을 되살린 채로 두면 태그 시점의 타입 게이트가 깨지므로 전부 주석으로 둡니다.
 *
 * 곁다리 확인 — dist/index.d.ts를 열어 보면 재수출 경로가 "./ledger.ts"로 적혀 있습니다.
 *   이 저장소는 소스에서 .ts 확장자를 그대로 적고, 컴파일러가 자바스크립트를 낼 때만 .js로
 *   바꾸기 때문입니다(dist/index.js는 "./ledger.js"입니다). 선언 파일 쪽 .ts 경로는 남지만,
 *   저장소 밖에서 이 패키지를 쓰는 쪽에도 문제가 되지 않는지 따로 확인했습니다. 저장소의
 *   설정을 하나도 물려받지 않은 별도 폴더(strict + module/moduleResolution nodenext)에서
 *   node_modules/ledger 링크만 걸고 타입 검사를 돌렸을 때 0 오류였습니다. 타입스크립트가
 *   선언 파일 안의 .ts 경로를 같은 이름의 .d.ts로 해석하기 때문입니다.
 */
