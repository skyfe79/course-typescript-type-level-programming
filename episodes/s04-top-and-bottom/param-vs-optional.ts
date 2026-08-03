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
