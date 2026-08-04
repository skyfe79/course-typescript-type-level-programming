// 커맨드 값을 실제 동작으로 옮기는 인터프리터 계층을 한 함수로 좁힙니다.
// 이펙트 실행 지점이 하나로 모이면 감사를 시작할 위치도 분명해집니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s15-effects-as-data/notify-interpreter.ts

// codeStep 227 — 인터프리터 함수 작성하기

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

// 이 파일에서 console.log를 직접 호출하는 곳은 이 함수 하나뿐이다.
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

// codeStep 228 — 코어에서 인터프리터 호출하기

const orders: OrderStatus[] = [
  { kind: "pickup", storeLocation: "강남점" },
  { kind: "delivery", deliveryAddress: "서울시 마포구 …" },
  { kind: "delayed", reason: "물량 부족" },
];

for (const order of orders) {
  const command = decideNotification(order);
  runCommand(command);
}

export {};
