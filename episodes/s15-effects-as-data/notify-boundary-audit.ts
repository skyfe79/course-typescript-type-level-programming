// 경계가 잘못 놓였다는 신호를 코드 위에 재현하고, 그 판단을 코어로 옮겨 바로잡습니다.
// 이 파일은 선언만 모아 둔 점검용이라 실행해도 출력이 없습니다 — 검사로 확인합니다.
// 검사: npx tsc --noEmit

// codeStep 237 — 세 번째 신호를 코드로 재현하기

type OrderStatus =
  | { kind: "pickup"; storeLocation: string }
  | { kind: "delivery"; deliveryAddress: string }
  | { kind: "delayed"; reason: string };

type NotificationCommand =
  | { kind: "sendEmail"; to: string; subject: string; body: string }
  | { kind: "sendInternalEmail"; to: string; subject: string; body: string }
  | { kind: "sendSms"; to: string; body: string }
  | { kind: "log"; message: string };

function decideNotification(order: OrderStatus): NotificationCommand {
  switch (order.kind) {
    case "pickup": {
      const subject = "픽업 준비 완료";
      const body = `${order.storeLocation}에서 주문을 픽업할 수 있습니다.`;
      if (order.storeLocation.startsWith("사내")) {
        return { kind: "sendInternalEmail", to: order.storeLocation, subject, body };
      }
      return { kind: "sendEmail", to: order.storeLocation, subject, body };
    }
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

function runCommandFlawed(command: NotificationCommand): void {
  switch (command.kind) {
    case "sendEmail":
      // ⚠ 세 번째 신호: 인터프리터가 실행이 아니라 여기서 직접 결정을 내리고 있다.
      if (command.to.endsWith("@internal.example.com")) {
        console.log(`[내부 채널] ${command.to}: ${command.subject}`);
      } else {
        console.log(`[이메일] ${command.to} / ${command.subject}: ${command.body}`);
      }
      break;
    case "sendSms":
      console.log(`[SMS] ${command.to}: ${command.body}`);
      break;
    case "log":
      console.log(`[로그] ${command.message}`);
      break;
  }
}

// codeStep 238 — 판단을 코어로 옮기고 인터프리터에서 조건문 걷어 내기

function runCommand(command: NotificationCommand): void {
  switch (command.kind) {
    case "sendInternalEmail":
      console.log(`[내부 채널] ${command.to}: ${command.subject}`);
      break;
    case "sendEmail":
      console.log(`[이메일] ${command.to} / ${command.subject}: ${command.body}`);
      break;
    case "sendSms":
      console.log(`[SMS] ${command.to}: ${command.body}`);
      break;
    case "log":
      console.log(`[로그] ${command.message}`);
      break;
  }
}

export {};
