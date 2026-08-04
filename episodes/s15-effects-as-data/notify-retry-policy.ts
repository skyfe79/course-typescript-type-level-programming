// 몇 번까지 얼마나 기다리며 다시 시도할지를 값 하나로 뽑아내면 정책이 코드 밖으로 드러납니다.
// 정책이 값이 되면 인터프리터를 부르지 않고도 정책만 따로 검사할 수 있습니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s15-effects-as-data/notify-retry-policy.ts

// codeStep 234 — 재시도 정책을 데이터로 정의하기

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

function runCommand(command: NotificationCommand): void {
  switch (command.kind) {
    case "sendEmail":
      console.log(
        `[이메일] ${command.to} / ${command.subject}: ${command.body}`,
      );
      break;
    case "sendSms":
      console.log(`[SMS] ${command.to}: ${command.body}`);
      break;
    case "log":
      console.log(`[로그] ${command.message}`);
      break;
  }
}

type RetryPolicy = {
  maxAttempts: number;
  delayMs: number;
};

const defaultRetryPolicy: RetryPolicy = { maxAttempts: 3, delayMs: 200 };
