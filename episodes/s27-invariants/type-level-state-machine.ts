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

export {};
