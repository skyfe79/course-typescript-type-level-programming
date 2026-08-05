// 문서에만 적혀 있던 연결 순서의 불변조건을 서로 다른 상태 타입으로 옮긴다.
// 실행: node episodes/s27-invariants/invariant-recipe.ts
// 검사: npx tsc --noEmit

// codeStep 383 — 문서 주석의 규칙을 타입으로 옮기기

// 고치기 전에는 connect와 send가 같은 타입에 함께 있다.
// 설명을 읽은 사람은 올바른 순서를 알 수 있지만, 컴파일러는 두 메서드의 호출 순서를 알 수 없다.
interface DocumentedConnection {
  /** send() 전에 반드시 호출하세요. */
  connect(): void;
  send(data: string): void;
}

// 따라서 이 타입만 보면 연결 전에 send를 호출해도 정상적인 코드로 컴파일된다.
// 값까지 만들 필요 없이, 다음 함수의 본문이 오류 없이 검사된다는 사실만으로 한계를 확인할 수 있다.
function sendWithDocumentationOnly(connection: DocumentedConnection): void {
  connection.send("hello");
}

// 1단계: 지켜야 할 불변조건에 "연결 전에는 전송할 수 없다"라는 이름을 붙인다.
// 2단계: 그 규칙을 지녀야 하는 값은 연결 객체 자신이다.
// 3단계: 연결 객체의 전과 후를 ClosedConnection과 OpenConnection이라는 서로 다른 타입으로 가른다.
interface OpenConnection {
  send(data: string): void;
}

// 연결 전 상태에는 connect만 공개한다. 특히 send는 선택적 메서드조차 아니며 아예 존재하지 않는다.
interface ClosedConnection {
  connect(): OpenConnection;
}

function createConnection(host: string): ClosedConnection {
  return {
    connect() {
      // 실제 시스템이라면 이 자리에서 소켓을 연다. 예제에서는 호스트를 로그에 남겨 연결을 표현한다.
      console.log(`[연결] ${host}에 연결했습니다.`);

      // connect가 돌려준 새 값만 send를 가지므로, 이후에 가능한 연산이 타입에 그대로 드러난다.
      return {
        send(data: string) {
          // 실제 시스템이라면 열린 소켓으로 data를 보낸다.
          console.log(`[전송] ${host}: ${data}`);
        },
      };
    },
  };
}

export {};
