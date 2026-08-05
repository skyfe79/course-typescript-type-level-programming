// 연결 전후를 서로 다른 타입으로 나눠, connect()를 거치기 전에는 send()를 꺼낼 수 없게 만든다.
// 실행: node episodes/s27-invariants/connection-api.ts
// 검사: npx tsc --noEmit

// codeStep 392 — Disconnected/Connected 상태로 Connection 정의하기

// Eq는 두 타입이 정확히 같은지 판별해, 편집기 호버 대신 기대한 타입 관계를 컴파일러에 고정한다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// 판별 필드 __tag는 연결의 두 상태를 타입 수준에서 서로 다른 이름으로 보관한다.
interface Disconnected {
  readonly __tag: "disconnected";
}

interface Connected {
  readonly __tag: "connected";
}

// host는 상태와 무관한 실제 데이터이고, __state는 런타임 객체에는 나타나지 않는 팬텀 필드다.
// 공통 데이터를 기반 타입에 두면 연결 전후의 두 타입이 같은 host 계약을 그대로 공유한다.
interface ConnectionBase<State> {
  readonly host: string;
  readonly __state?: State;
}

// 연결 전 타입에는 send가 아예 없다. 이 비어 있음 자체가 "아직 보낼 수 없다"는 불변식이다.
interface DisconnectedConnection extends ConnectionBase<Disconnected> {
  // connect는 연결 전 상태에서만 꺼내 쓸 수 있는 전이 메서드다.
  // 현재 객체를 바꾸는 대신 다음 상태인 ConnectedConnection을 반환 타입으로 약속한다.
  connect(): ConnectedConnection;
}

// send는 연결이 끝난 상태에만 공개한다. 선택적 메서드가 아니므로 존재 여부가 상태를 그대로 표현한다.
interface ConnectedConnection extends ConnectionBase<Connected> {
  send(data: string): void;
}

// keyof를 사용해 두 타입에서 send의 존재 여부를 직접 계산한다.
type DisconnectedHasSend = "send" extends keyof DisconnectedConnection ? true : false;
type ConnectedHasSend = "send" extends keyof ConnectedConnection ? true : false;

const disconnectedHasNoSend: Eq<DisconnectedHasSend, false> = true;
const connectedHasSend: Eq<ConnectedHasSend, true> = true;

// 상태가 달라져도 공통 데이터 host의 타입은 양쪽 모두 string으로 보존된다.
const disconnectedKeepsHost: Eq<DisconnectedConnection["host"], string> = true;
const connectedKeepsHost: Eq<ConnectedConnection["host"], string> = true;

// codeStep 393 — connect()로 상태 전이시키기

// 팩터리는 항상 연결 전 상태를 돌려준다. 이 반환 타입 때문에 호출자는 처음부터 send를 볼 수 없다.
function createConnection(host: string): DisconnectedConnection {
  return {
    host,
    connect() {
      // 현재 객체를 변이해 같은 타입으로 남겨 두지 않고, 다음 상태를 나타내는 새 객체를 반환한다.
      return {
        // 실제 데이터도 새 상태 객체에 함께 옮겨지므로 상태 전이가 host를 잃지 않는다.
        host,
        send(data: string) {
          console.log(`[${host}] send: ${data}`);
        },
      };
    },
  };
}

const connection = createConnection("localhost");

// 팩터리가 돌려준 값의 타입은 정확히 DisconnectedConnection이다.
const createReturnsDisconnected: Eq<typeof connection, DisconnectedConnection> = true;

// 반환값을 이어 받으면 호출 순서가 값의 흐름과 타입의 흐름에 함께 나타난다.
const connected = connection.connect();

// connect()가 돌려준 값의 타입은 다음 상태인 ConnectedConnection으로 정확히 고정된다.
// 반환 타입이 달라지는 것 자체가 타입 수준의 상태 전이다.
const connectReturnsConnected: Eq<typeof connected, ConnectedConnection> = true;

// 타입에서 확인한 전이는 실행 결과로도 그대로 이어진다.
connected.send("hi");

// codeStep 394 — connect() 없이 send() 호출해 컴파일 에러 확인하기

// 순서를 어긴 호출과 순서를 지킨 호출을 나란히 두고, 앞의 것만 막히는지 확인한다.
function trySendBeforeConnect(): void {
  // Node의 타입 스트리핑은 타입 오류를 실행 중에 막지 않으므로, 이 함수는 정의만 하고 호출하지 않는다.
  // @ts-expect-error - 연결 전 상태인 DisconnectedConnection에는 send 메서드가 없다
  connection.send("hi");
  // 실측 진단(@ts-expect-error 한 줄만 제거했을 때):
  // episodes/s27-invariants/connection-api.ts(88,14): error TS2339: Property 'send' does not exist on type 'DisconnectedConnection'.
}

// 도입에서 본 런타임 크래시는 이제 프로그램이 실행되기도 전에 타입 오류로 사라진다.
// 반면 connect()를 먼저 거친 호출은 그대로 통과하므로, 정상적인 사용까지 막히지는 않는다.
connection.connect().send("connect() 다음이라 통과합니다");

export {};
