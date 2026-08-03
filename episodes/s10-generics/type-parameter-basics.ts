function identity<T>(value: T): T {
  return value;
}

const explicitString: string = identity<string>("hello");
const explicitNumber: number = identity<number>(42);

console.log(explicitString);
console.log(explicitNumber);

const inferredString = identity("hello");
const inferredNumber = identity(42);

console.log(inferredString);
console.log(inferredNumber);

// 타입 인자로 number를 직접 지정하면 value도 number여야 한다.
// const mismatch = identity<number>("hello");
// error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.

export {};
