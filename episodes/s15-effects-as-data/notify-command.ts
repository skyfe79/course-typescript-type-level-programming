// 커맨드를 판별 유니온으로 표현하면 코어가 셸에 요청할 일을 정확히 드러낼 수 있습니다.
// decideNotification과 sendNotification 사이의 유일한 인터페이스를 값으로 고정합니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s15-effects-as-data/notify-command.ts

// codeStep 222 — 커맨드 타입 정의하기

type OrderFulfillmentSum =
  | { kind: "pickup"; storeLocation: string }
  | { kind: "delivery"; deliveryAddress: string };

type NotificationCommand =
  | { kind: "sendEmail"; to: string; subject: string; body: string }
  | { kind: "sendSms"; to: string; body: string };

function decideNotification(
  order: OrderFulfillmentSum,
): NotificationCommand {
  if (order.kind === "pickup") {
    return {
      kind: "sendEmail",
      to: order.storeLocation,
      subject: "픽업 준비 완료",
      body: `${order.storeLocation}에서 주문을 픽업할 수 있습니다.`,
    };
  }
  return {
    kind: "sendSms",
    to: order.deliveryAddress,
    body: "배송이 출발했습니다.",
  };
}

console.log(
  decideNotification({ kind: "pickup", storeLocation: "강남점" }),
);

// codeStep 223 — 코어와 셸 사이 인터페이스로 쓰기

function sendNotification(command: NotificationCommand): void {
  switch (command.kind) {
    case "sendEmail":
      console.log(
        `[이메일] ${command.to} / ${command.subject}: ${command.body}`,
      );
      break;
    case "sendSms":
      console.log(`[SMS] ${command.to}: ${command.body}`);
      break;
  }
}

const command = decideNotification({
  kind: "delivery",
  deliveryAddress: "서울시 마포구 …",
});
sendNotification(command);

export {};
