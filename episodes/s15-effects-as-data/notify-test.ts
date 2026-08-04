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
