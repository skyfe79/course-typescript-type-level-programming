function firstUnknown(arr: unknown[]): unknown {
  return arr[0];
}

const nums = [1, 2, 3];
const value = firstUnknown(nums);

console.log(value);

// unknown은 바로 number로 쓸 수 없다.
// const firstNumber: number = value;
// error TS2322: Type 'unknown' is not assignable to type 'number'.

function first<T>(arr: T[]): T {
  return arr[0];
}

const firstNum: number = first(nums);

console.log(firstNum);

export {};
