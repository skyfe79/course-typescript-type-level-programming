// STEP 500 — strict가 꺼진 1.x 시절 설정에서 위험한 코드가 그대로 통과하는 것을 확인하기

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

// 이 예제에서 사용하는 Array.prototype.find는 일치하는 값이 없으면 undefined를 반환합니다.
// strict가 꺼진 1.x 시절식 설정에서는 undefined가 User 자리에 들어가도 오류가 나지 않습니다.
function findUser(id: number, users: User[]): User {
  // strict라면 User | undefined를 User 반환 타입에 할당할 수 없다는 오류가 납니다.
  return users.find((user) => user.id === id);
}

// 먼저 1.x 시대에 이미 존재했던 제네릭과 유니온 타입이 정상 동작하는 모습을 출력합니다.
// 이 함수 자체보다 중요한 점은 findUser의 잘못된 반환 타입 선언을 컴파일러가 믿는다는 것입니다.
function main() {
  console.log(`identity: ${identity("Ada")}`);
  console.log(`formatId: ${formatId(7)}, ${formatId("user-7")}`);

  const users: User[] = [{ id: 1, name: "Ada" }];
  const found = findUser(2, users); // 목록에 없는 id이므로 실제 값은 undefined입니다.

  // found의 선언상 타입은 User이므로 컴파일은 통과하지만, 실제로는 undefined라 런타임에서 실패합니다.
  // 옵셔널 체이닝이나 존재 여부 가드를 넣지 않아야 컴파일러의 침묵과 런타임 오류를 확인할 수 있습니다.
  console.log(found.name);
}

main();
