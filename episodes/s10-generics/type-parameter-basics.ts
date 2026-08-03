function identity<T>(value: T): T {
  return value;
}

const explicitString: string = identity<string>("hello");
const explicitNumber: number = identity<number>(42);

console.log(explicitString);
console.log(explicitNumber);

export {};
