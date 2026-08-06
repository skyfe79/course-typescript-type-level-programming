// STEP 502 — unknown으로 받은 값을 단언 시그니처로 좁혀 안전하게 사용하기

// 저장소 전체를 검사할 때 다른 에피소드의 같은 이름 선언과 합쳐지지 않도록
// 이 파일만의 모듈 스코프를 만듭니다. 아래 예제의 실행 결과에는 영향을 주지 않습니다.
export {};

// 화별 파일은 다른 화를 가져오지 않고도 혼자 읽고 실행할 수 있어야 합니다.
// 따라서 지난 화와 모양이 같더라도 이 예제에 필요한 User를 이 파일에서 다시 선언합니다.
interface User {
  id: number;
  name: string;
}

// TypeScript 3.0 이전에는 외부에서 들어온 값의 타입을 모를 때 any가 사실상 유일한 탈출구였습니다.
// any는 아래 프로퍼티 접근과 메서드 호출을 검사하지 않으므로 잘못된 값도 컴파일을 통과합니다.
const valueFromAny: any = { name: "unchecked" };
const uncheckedName = valueFromAny.name.toUpperCase();

// 3.0의 unknown도 모든 값을 받을 수 있는 최상위 타입이지만, 사용하는 쪽에는 검사를 요구합니다.
const valueFromUnknown: unknown = "checked";
// valueFromUnknown.name; // ← unknown 상태에서는 프로퍼티 접근이 거부됩니다.
// valueFromUnknown();    // ← unknown 상태에서는 함수 호출도 거부됩니다.

let checkedText = "문자열이 아닙니다";
if (typeof valueFromUnknown === "string") {
  // typeof 검사를 통과한 이 블록에서만 string의 메서드를 안전하게 사용할 수 있습니다.
  checkedText = valueFromUnknown.toUpperCase();
}

// 타입 술어는 boolean 결과와 함께 참인 분기에서 value가 User라는 정보를 전달합니다.
// 먼저 object와 null을 구별해야 in 연산자를 쓸 수 있고, 프로퍼티의 존재뿐 아니라 타입도 검사해야
// 단지 id와 name이라는 키만 가진 잘못된 객체를 User로 오인하지 않습니다.
function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    typeof value.id === "number" &&
    typeof value.name === "string"
  );
}

// value is User 타입 술어는 boolean을 돌려주므로 호출자가 if로 성공과 실패를 갈라야 합니다.
// asserts value is User 단언 시그니처는 실패하면 함수가 끝나지 않으며, 호출문 아래부터 호출자의
// value를 User로 좁힌 채 제어 흐름을 계속 진행하게 합니다.
// 단언 시그니처의 호출 대상은 명시적으로 타입이 붙은 이름이어야 하며, function 선언은 이 조건을
// 만족합니다. 타입 주석 없는 const 함수에 담으면 TS2775가 발생할 수 있습니다.
function assertIsUser(value: unknown): asserts value is User {
  if (!isUser(value)) {
    throw new Error("raw value is not a User");
  }
}

function loadUser(raw: unknown): User {
  // 아래 호출을 주석 처리하면 return raw에서
  // TS2322: Type 'unknown' is not assignable to type 'User' 오류가 발생합니다.
  assertIsUser(raw);

  // 단언 함수가 호출자 쪽 raw를 좁혔으므로 별도의 if나 타입 단언 없이 그대로 반환할 수 있습니다.
  return raw;
}

// 일반 객체 리터럴의 프로퍼티는 나중에 다른 값을 대입할 수 있으므로 source가 string으로 넓어집니다.
const wideConfig = { source: "api", retries: 3 };
const wideSource: string = wideConfig.source;

// TypeScript 3.4의 as const는 값을 "api"와 3이라는 리터럴 타입으로 고정하고 프로퍼티도 readonly로
// 만듭니다. 이 동작은 훗날 4.9의 satisfies와 비교할 추론 방식의 토대가 됩니다.
const config = { source: "api", retries: 3 } as const;
const narrowSource: "api" = config.source;
// config.source = "file"; // ← TS2540: 읽기 전용 프로퍼티입니다.

interface UserResponse {
  profile?: {
    contact?: {
      email?: string;
    };
  };
}

const responseWithoutProfile: UserResponse = {};

// TypeScript 3.7의 옵셔널 체이닝은 중간 값이 null 또는 undefined이면 평가를 멈추고 undefined를
// 반환합니다. 타입 체커도 이 단락 평가를 이해하므로 email의 타입은 string | undefined가 됩니다.
const optionalEmail = responseWithoutProfile.profile?.contact?.email;

// 같은 릴리스의 ??는 null 또는 undefined일 때만 기본값을 사용합니다.
// ||와 달리 유효한 값인 0, "", false를 기본값으로 덮어쓰지 않습니다.
const email = optionalEmail ?? "unknown@example.com";

function main() {
  console.log(`any: ${uncheckedName}`);
  console.log(`unknown after narrowing: ${checkedText}`);

  const user = loadUser({ id: 1, name: "Ada" });
  console.log(`loadUser: ${user.id}, ${user.name}`);

  // as const를 붙이지 않은 값과 붙인 값은 실행 시 같지만, 위 선언에서 서로 다른 타입으로 검사됩니다.
  console.log(`as const: ${wideSource} -> ${narrowSource}, retries ${config.retries}`);
  console.log(`optional chaining + nullish coalescing: ${email}`);

  // 올바르지 않은 값에서는 단언 함수가 실제로 예외를 던지고, 여기서 처리하므로 정상 종료합니다.
  try {
    loadUser({ id: "not-a-number", name: "Grace" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`invalid user: ${message}`);
  }
}

main();
