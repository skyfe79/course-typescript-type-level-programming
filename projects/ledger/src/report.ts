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

import type { Transaction } from "./ledger.ts";

/*
 * 거래 하나의 차변 금액을 구하는 자리는 이 함수 하나입니다. simple은 차변이 한 줄이라
 * 그 줄의 금액이 곧 합계이고, split은 여러 줄이라 합을 구해야 합니다. 아래 포매터도
 * 이 함수를 불러 쓰므로, 같은 덧셈이 파일 안에 두 번 적히지 않습니다.
 *
 * 이 파일에는 완전성 검사가 두 번 나옵니다. 같은 것을 두 번 검사하는 것이 아니라,
 * 갈래마다 답이 달라지는 질문이 둘이기 때문입니다. 여기서 묻는 것은 "차변이 얼마인가"이고,
 * 아래 formatTransaction이 묻는 것은 "이 거래를 어떤 문장으로 적을 것인가"입니다.
 */
function sumDebitMinor(tx: Transaction): number {
  switch (tx.kind) {
    case "simple":
      return tx.debit.amount.amountMinor;
    case "split":
      return tx.debits.reduce((total, line) => total + line.amount.amountMinor, 0);
    default: {
      /*
       * 이 줄이 컴파일된다는 사실 자체가, 지금 이 시점에 Transaction의 모든 갈래가
       * 위 switch에서 처리됐다는 컴파일러의 증명입니다. 나중에 거래 유니온에 새
       * kind가 추가되면 tx가 never로 좁혀지지 않아 이 자리에서 타입 오류가 납니다.
       */
      const _exhaustive: never = tx;
      return _exhaustive;
    }
  }
}

function formatTransaction(tx: Transaction): string {
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
    default: {
      /*
       * const _exhaustive: never = tx가 컴파일된다는 사실은 "이 시점의 Transaction
       * 유니온에서 simple과 split 두 갈래가 전부 처리됐다"는 뜻입니다. 다음 화에서
       * 새 갈래를 더하고 이 switch를 고치지 않으면, 바로 이 줄이 빠진 case를 알려줍니다.
       */
      const _exhaustive: never = tx;
      return _exhaustive;
    }
  }
}

function formatReport(transactions: readonly Transaction[]): string {
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
