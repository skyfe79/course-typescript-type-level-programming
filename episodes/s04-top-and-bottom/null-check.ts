// strictNullChecks는 null과 undefined를 다른 타입에 저절로 섞이지 않는 유니온 멤버로 만든다.

function formatGreeting(name: string): string {
  return `Hello, ${name}`;
}

// let userName: string = null;
// console.log(formatGreeting(userName));
// error TS2322: Type 'null' is not assignable to type 'string'.

// tsconfig.json의 strictNullChecks를 잠시 false로 바꾸면 위 코드는 통과한다.
// 이때 node로 실행하면 "Hello, null"이 출력되고, true로 되돌리면 다시 TS2322로 막힌다.

let nullableUserName: string | null = null;
console.log(formatGreeting(nullableUserName ?? "Guest"));

nullableUserName = "Ada";
if (nullableUserName !== null) {
  console.log(formatGreeting(nullableUserName));
}
