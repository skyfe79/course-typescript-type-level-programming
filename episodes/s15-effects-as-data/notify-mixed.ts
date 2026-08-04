// 결정과 실행을 한 함수에 섞으면 테스트해야 할 대상이 흐려집니다.
// 이펙트를 값으로 분리하면 결정은 데이터로 확인하고 실행은 따로 다룰 수 있습니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s15-effects-as-data/notify-mixed.ts

// codeStep 220 — 섞인 함수 살펴보기

type OrderFulfillmentSum =
  | { kind: "pickup"; storeLocation: string }
  | { kind: "delivery"; deliveryAddress: string };

function notifyCustomer(order: OrderFulfillmentSum): void {
  if (order.kind === "pickup") {
    // 결정과 실행이 한 줄 안에 섞여 있다
    console.log(`[이메일 전송] ${order.storeLocation}에서 픽업 준비 완료`);
  } else {
    console.log(`[SMS 전송] ${order.deliveryAddress}로 배송 출발`);
  }
}

notifyCustomer({ kind: "pickup", storeLocation: "강남점" });
// 이 함수를 테스트하려면 console.log 자체를 가로채는 장치가 필요하다

// codeStep 221 — 이펙트를 반환값으로 분리하기

type NotificationDescription =
  | { channel: "email"; to: string; message: string }
  | { channel: "sms"; to: string; message: string };

function decideNotification(
  order: OrderFulfillmentSum,
): NotificationDescription {
  if (order.kind === "pickup") {
    return {
      channel: "email",
      to: order.storeLocation,
      message: "픽업 준비 완료",
    };
  }
  return {
    channel: "sms",
    to: order.deliveryAddress,
    message: "배송 출발",
  };
}

function sendNotification(description: NotificationDescription): void {
  console.log(
    `[${description.channel} 전송] ${description.to}: ${description.message}`,
  );
}

const description = decideNotification({
  kind: "pickup",
  storeLocation: "강남점",
});
console.log(description);
sendNotification(description);

export {};
