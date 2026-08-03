// string | undefined 매개변수는 값을 반드시 받지만, 그 값은 undefined일 수 있다.

// function printLength(value: string | undefined): void {
//   console.log("length:", value.length);
// }
// error TS18048: 'value' is possibly 'undefined'.

function printLength(value: string | undefined): void {
  if (value === undefined) {
    console.log("length:", "no value passed");
  } else {
    console.log("length:", value.length);
  }
}

printLength("hello");
printLength(undefined);

// 인자를 생략하면 다음 호출은 막힌다.
// printLength();
// error TS2554: Expected 1 arguments, but got 0.

interface User {
  name?: string;
}

// function printNameLength(user: User): void {
//   console.log("length:", user.name.length);
// }
// error TS18048: 'user.name' is possibly 'undefined'.

function printNameLength(user: User): void {
  if (user.name === undefined) {
    console.log("length:", "no value passed");
  } else {
    console.log("length:", user.name.length);
  }
}

printNameLength({ name: "Ada" });
// 옵셔널 프로퍼티는 키를 생략할 수 있으므로 빈 객체 호출도 통과한다.
printNameLength({});

function printLengthSafe(value: string | undefined): void {
  console.log("length:", value?.length ?? "no value passed");
}

function printNameLengthSafe(user: User): void {
  console.log("has name key:", "name" in user);
  console.log("length:", user.name?.length ?? "no value passed");
}

printLengthSafe(undefined);
printNameLengthSafe({});
printNameLengthSafe({ name: undefined });

// 매개변수는 값이 전달되어야 하지만, 그 값이 undefined일 수 있다.
// 옵셔널 프로퍼티는 키가 없거나, 키는 있고 값이 undefined인 두 경우를 허용한다.
// in 연산자는 이 두 객체 상태를 구분한다.
