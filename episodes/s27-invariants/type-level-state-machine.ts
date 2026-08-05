// 연결 상태를 타입 매개변수로 옮겨, 메서드의 반환 타입으로 프로토콜 전이를 표현한다.
// 실행: node episodes/s27-invariants/type-level-state-machine.ts
// 검사: npx tsc --noEmit

// codeStep 390 — 상태 머신 타입 뼈대

// 이 구현에서 연결 여부는 클로저 안의 불리언 값에만 들어 있다.
// 반환된 객체의 타입에는 현재 연결 상태가 전혀 드러나지 않는다.
function createNaiveConnection() {
  let connected = false;

  return {
    connect(): void {
      connected = true;
      console.log("연결됨");
    },
    send(message: string): void {
      if (!connected) {
        console.log(`전송 실패 — 아직 연결되지 않았습니다: ${message}`);
        return;
      }
      console.log(`전송: ${message}`);
    },
    disconnect(): void {
      connected = false;
      console.log("연결 끊김");
    },
  };
}

const naive = createNaiveConnection();

// connect() 없이 부른 호출인데 컴파일러는 아무 말도 하지 않고, 실행할 때에야 실패가 드러난다.
naive.send("hello");
// 연결한 적이 없는데 끊는 호출도 타입에는 항상 존재하므로 그대로 통과한다.
naive.disconnect();

// Eq는 두 타입이 정확히 같은지 판별해, 편집기 호버 대신 기대한 타입 관계를 컴파일러에 고정한다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// 판별 필드 __tag는 각 상태의 이름을 타입 수준에서 보관한다.
interface Disconnected {
  readonly __tag: "disconnected";
}

interface Connected {
  readonly __tag: "connected";
}

// __state는 상태를 구별하기 위한 팬텀 필드이며 실행 중인 객체에는 나타나지 않는다.
interface Connection<State> {
  readonly __state?: State;
}

// 아직 메서드가 하나도 없어도 팬텀 상태가 다르므로 두 연결 타입은 같지 않다.
const connectionStatesAreDistinct: Eq<Connection<Disconnected>, Connection<Connected>> = false;

function tryToAssignConnectedAsDisconnected(): void {
  const connected: Connection<Connected> = {};

  // Connected 상태의 연결은 Disconnected 상태의 연결 자리에 대입할 수 없다.
  // @ts-expect-error - Connection<Connected>와 Connection<Disconnected>는 서로 다른 상태 타입이다
  const disconnected: Connection<Disconnected> = connected;
  // 실측 진단(오류 지시어 한 줄만 제거했을 때):
  // episodes/s27-invariants/type-level-state-machine.ts(62,9): error TS2322: Type 'Connection<Connected>' is not assignable to type 'Connection<Disconnected>'.
  //   Type 'Connected' is not assignable to type 'Disconnected'.
  //     Types of property '__tag' are incompatible.
  //       Type '"connected"' is not assignable to type '"disconnected"'.
}

// codeStep 391 — 전이 메서드와 완전성 질문

// connect는 Disconnected 상태에서만 꺼내 쓸 수 있는 전이 메서드다.
// 현재 객체를 바꾸는 대신 다음 상태인 Connection<Connected>를 반환 타입으로 약속한다.
interface DisconnectedConnection extends Connection<Disconnected> {
  connect(): Connection<Connected>;
}

// 팩토리가 처음 돌려주는 값은 언제나 연결 전 상태다.
function createConnection(): DisconnectedConnection {
  return {
    connect() {
      console.log("connect(): Connection<Connected> 타입의 값을 새로 돌려준다");
      // __state는 선택적인 팬텀 필드라서 런타임 객체에 상태 값을 넣을 필요가 없다.
      return {};
    },
  };
}

// 반환값을 이어 받으면 호출 순서가 값의 흐름과 타입의 흐름에 함께 나타난다.
const disconnectedConnection = createConnection();
const connectedConnection = disconnectedConnection.connect();

// connect()가 반환한 값의 타입은 다음 상태인 Connection<Connected>로 정확히 고정된다.
const connectReturnsConnected: Eq<typeof connectedConnection, Connection<Connected>> = true;

// 모든 상태 중 현재 전이 메서드를 하나라도 가진 상태만 따로 모은다.
type ConnectionState = Disconnected | Connected;
type StatesWithTransition = Disconnected;

// 전체 상태에서 나갈 전이가 있는 상태를 빼면, 현재 프로토콜에서 갇힌 상태가 계산된다.
type StuckStates = Exclude<ConnectionState, StatesWithTransition>;
// 지금은 Connected가 그대로 남지만, 다음 화에서는 send와 disconnect 전이로 이 빈자리를 채운다.
const connectedHasNoWayOut: Eq<StuckStates, Connected> = true;

// 이는 판별 유니온의 완전성 검사와 같은 질문이다.
// 처리되지 않은 경우가 모두 사라져 never가 되는지 묻듯, 완성된 상태 머신이라면 StuckStates도 never여야 한다.

export {};
