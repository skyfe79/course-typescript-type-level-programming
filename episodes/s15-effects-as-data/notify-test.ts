// 순수 결정 함수는 목 없이 반환된 커맨드 값을 그대로 테스트할 수 있습니다.
// Node 내장 test 모듈로 이펙트를 데이터처럼 검증합니다.
// 검사: npx tsc --noEmit
// 실행: node --test episodes/s15-effects-as-data/notify-test.ts

// codeStep 224 — 세 가지 상황과 세 가지 명령 정의하기

type OrderStatus =
  | { kind: "pickup"; storeLocation: string }
  | { kind: "delivery"; deliveryAddress: string }
  | { kind: "delayed"; reason: string };

type NotificationCommand =
  | { kind: "sendEmail"; to: string; subject: string; body: string }
  | { kind: "sendSms"; to: string; body: string }
  | { kind: "log"; message: string };

// codeStep 225 — 순수 결정 함수 작성하기

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

// codeStep 226 — 목 없이 테스트 작성하기

import { test } from "node:test";
import assert from "node:assert/strict";

test("픽업이면 이메일 커맨드를 돌려준다", () => {
  const command = decideNotification({
    kind: "pickup",
    storeLocation: "강남점",
  });
  assert.deepStrictEqual(command, {
    kind: "sendEmail",
    to: "강남점",
    subject: "픽업 준비 완료",
    body: "강남점에서 주문을 픽업할 수 있습니다.",
  });
});

test("배송이면 SMS 커맨드를 돌려준다", () => {
  const command = decideNotification({
    kind: "delivery",
    deliveryAddress: "서울시 마포구 …",
  });
  assert.deepStrictEqual(command, {
    kind: "sendSms",
    to: "서울시 마포구 …",
    body: "배송이 출발했습니다.",
  });
});

test("지연이면 로그 커맨드를 돌려준다", () => {
  const command = decideNotification({
    kind: "delayed",
    reason: "물량 부족",
  });
  assert.deepStrictEqual(command, {
    kind: "log",
    message: "지연 사유: 물량 부족",
  });
});
