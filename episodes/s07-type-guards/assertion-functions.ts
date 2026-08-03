interface User {
  id: number;
  name: string;
}

function assertDefined<T>(value: T, label: string): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(`${label} is null or undefined`);
  }
}

function describeUser(id: number, users: Map<number, User>): string {
  const user = users.get(id);
  assertDefined(user, `user ${id}`);
  return `User: ${user.name}`;
}

const users = new Map<number, User>([[1, { id: 1, name: "Ada" }]]);
console.log(describeUser(1, users));
console.log(describeUser(2, users));

// assertDefined 호출을 지우면 다음 줄이 컴파일되지 않는다.
// function describeUserWithoutAssert(id: number, users: Map<number, User>): string {
//   const user = users.get(id);
//   return `User: ${user.name}`;
// }
// error TS18048: 'user' is possibly 'undefined'.

export {};
