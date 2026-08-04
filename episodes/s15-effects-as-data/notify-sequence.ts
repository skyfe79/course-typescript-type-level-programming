// 커맨드 여러 개를 배열로 묶어 실행 순서를 값으로 표현합니다.
// 실패와 재시도까지 같은 커맨드 유니온에 넣으면 흐름 전체를 데이터로 다룰 수 있습니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s15-effects-as-data/notify-sequence.ts

// codeStep 232 — 순서가 있는 명령 목록 만들기

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

const escalationSequence: NotificationCommand[] = [
  { kind: "log", message: "재고 부족 경보 절차를 시작합니다." },
  {
    kind: "sendEmail",
    to: "ops@example.com",
    subject: "재고 부족 경보",
    body: "재고가 임계치 아래로 내려갔습니다.",
  },
  { kind: "sendSms", to: "010-0000-0000", body: "재고 부족, 이메일을 확인하세요." },
];

function runSequence(commands: NotificationCommand[]): void {
  for (const command of commands) {
    runCommand(command);
  }
}

runSequence(escalationSequence);
