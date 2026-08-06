// STEP 501 — 오래된 저장소에 2.x의 타입 기능을 한 단계씩 적용해 안전한 코드로 마이그레이션하기

// 저장소 전체를 검사할 때 다른 에피소드의 같은 이름 선언과 합쳐지지 않도록
// 이 파일만의 모듈 스코프를 만듭니다. 아래 예제의 실행 결과에는 영향을 주지 않습니다.
export {};

interface User {
  id: number;
  name: string;
}

// 제네릭은 TypeScript 1.0부터 사용할 수 있었습니다.
// 입력 타입 T를 그대로 반환하므로 strict가 켜져 있어도 이 함수에는 걸리는 문제가 없습니다.
function identity<T>(value: T): T {
  return value;
}

// 유니온 타입은 TypeScript 1.4부터 사용할 수 있었습니다.
// typeof로 number와 string을 좁힌 뒤 각 타입에 맞게 처리하므로 strict에서도 안전합니다.
function formatId(id: number | string): string {
  return typeof id === "number" ? id.toFixed(0) : id;
}

// TypeScript 2.0의 never는 이 함수가 정상적으로 호출자에게 돌아오지 않음을 표현합니다.
// 함수 선언에서 반환 타입 주석을 생략하면 호환성을 위해 void로 추론될 수 있으므로,
// 제어 흐름 분석에 종료 지점을 알려 주려면 여기서는 반환 타입을 never로 명시해야 합니다.
function fail(message: string): never {
  throw new Error(message);
}

// Array.prototype.find의 결과는 User | undefined입니다. 찾지 못한 경로에서 fail을 호출하면
// never를 반환한다고 선언된 호출 아래는 도달 불가로 분석되고, 남은 경로는 User로 좁혀집니다.
function findUser(id: number, users: User[]): User {
  const found = users.find((user) => user.id === id);
  if (!found) fail(`user ${id} not found`);
  return found;
}

// TypeScript 2.1의 keyof는 객체 타입이 가진 프로퍼티 이름을 유니온 타입으로 얻습니다.
type UserKeys = keyof User;

// K를 실제 T의 키로 제한하므로 존재하지 않는 프로퍼티 이름은 전달할 수 없습니다.
// 표준 유틸리티 Pick<T, K>는 K의 각 키를 순회하는 '매핑된 타입'으로 만들어졌습니다.
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;

  for (const key of keys) {
    result[key] = obj[key];
  }

  return result;
}

// TypeScript 2.8의 조건부 타입과 infer로 배열 원소 타입을 꺼냅니다.
// 배열이 아닌 타입에서는 never를 반환해 이번에는 '해당하는 원소 타입 없음'을 표현합니다.
type ElementType<T> = T extends (infer U)[] ? U : never;
type UserFromArray = ElementType<User[]>;

// 1.x에 있던 기능부터 2.0, 2.1, 2.8 순서로 결과를 확인합니다.
function main() {
  console.log(`identity: ${identity("Ada")}`);
  console.log(`formatId: ${formatId(7)}, ${formatId("user-7")}`);

  const users: User[] = [{ id: 1, name: "Ada" }];
  const found = findUser(1, users);
  console.log(`findUser: ${found.name}`);

  // UserKeys를 실제 변수에 사용해 "name"이 User의 키라는 사실도 함께 검사합니다.
  const selectedKey: UserKeys = "name";
  const selected = pick(found, [selectedKey]);
  console.log(`pick: ${JSON.stringify(selected)}`);

  // ElementType<User[]>의 결과가 User이므로 User 객체를 그대로 할당할 수 있습니다.
  const userFromArray: UserFromArray = users[0];
  console.log(`ElementType: ${userFromArray.name}`);

  // 지난 단계에서는 없는 사용자가 조용히 undefined가 되어 나중에 TypeError를 만들었습니다.
  // 이제는 조회 실패 지점에서 의미 있는 오류를 던지고, 여기서 처리해 프로그램도 정상 종료합니다.
  try {
    findUser(2, users);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`missing user: ${message}`);
  }
}

main();
