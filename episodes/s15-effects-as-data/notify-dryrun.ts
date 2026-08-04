// 코어는 그대로 두고 인터프리터만 바꿔 끼워 드라이런 모드를 만듭니다.
// 같은 시그니처를 만족하는 함수라면 무엇이든 그 자리에 들어갈 수 있습니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s15-effects-as-data/notify-dryrun.ts
// 실행(드라이런): node episodes/s15-effects-as-data/notify-dryrun.ts --dry-run

// codeStep 229 — 로깅만 하는 인터프리터 작성하기

type OrderStatus =
  | { kind: "pickup"; storeLocation: string }
  | { kind: "delivery"; deliveryAddress: string }
  | { kind: "delayed"; reason: string };

type NotificationCommand =
  | { kind: "sendEmail"; to: string; subject: string; body: string }
  | { kind: "sendSms"; to: string; body: string }
  | { kind: "log"; message: string };

function decideNotification(order: OrderStatus): NotificationCommand {
  switch (order.kind) {
    case "pickup":
      return {
        kind: "sendEmail",
        to: order.storeLocation,
        subject: "픽업 준비 완료",
        body: `${order.storeLocation}에서 주문을 픽업할 수 있습니다.`,
      };
    case "delivery":
      return {
        kind: "sendSms",
        to: order.deliveryAddress,
        body: "배송이 출발했습니다.",
      };
    case "delayed":
      return { kind: "log", message: `지연 사유: ${order.reason}` };
    default: {
      const _exhaustive: never = order;
      throw new Error("다루지 않은 kind");
    }
  }
}

function runCommandDryRun(command: NotificationCommand): void {
  switch (command.kind) {
    case "sendEmail":
      console.log(
        `[드라이런] 이메일 발송 예정 — ${command.to} / ${command.subject}`,
      );
      break;
    case "sendSms":
      console.log(`[드라이런] SMS 발송 예정 — ${command.to}`);
      break;
    case "log":
      console.log(`[드라이런] 로그 기록 예정 — ${command.message}`);
      break;
  }
}
