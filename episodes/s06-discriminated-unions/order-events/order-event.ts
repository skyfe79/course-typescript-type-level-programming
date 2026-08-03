type OrderEvent =
  | { kind: "created"; orderId: string }
  | { kind: "paid"; orderId: string; amount: number }
  | { kind: "shipped"; orderId: string; trackingId: string }
  | { kind: "cancelled"; orderId: string; reason: string };
// 위 cancelled 변형을 추가하고 세 파일에는 아직 case를 채우지 않은 상태에서, 저장소 루트에서
// npx tsc --noEmit 을 한 번 실행해 아래 세 에러가 한꺼번에 나왔다(줄 번호는 그 시점의 것이다).
// 메시지는 셋 다 같지만 파일과 줄 번호가 달라, 컴파일러가 각 파일에서 무엇을 빠뜨렸는지 스스로 짚어 준다.
// episodes/s06-discriminated-unions/order-events/audit-logger.ts(18,13): error TS2322: Type '{ kind: "cancelled"; orderId: string; reason: string; }' is not assignable to type 'never'.
// episodes/s06-discriminated-unions/order-events/notification-router.ts(12,13): error TS2322: Type '{ kind: "cancelled"; orderId: string; reason: string; }' is not assignable to type 'never'.
// episodes/s06-discriminated-unions/order-events/order-processor.ts(16,13): error TS2322: Type '{ kind: "cancelled"; orderId: string; reason: string; }' is not assignable to type 'never'.
// ⚠️ 파일 하나만 지정해 npx tsc --noEmit <파일>로 실행하면 타입 검사가 시작조차 하지 않는다.
// error TS5112: tsconfig.json is present but will not be loaded if files are specified on commandline. Use '--ignoreConfig' to skip this error.

export type { OrderEvent };
