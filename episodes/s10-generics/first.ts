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

const words = ["a", "b", "c"];
const flags = [true, false];
const users = [
  { id: 1, name: "Ada" },
  { id: 2, name: "Alan" },
];

const firstWord: string = first(words);
const firstFlag: boolean = first(flags);
const firstUser: { id: number; name: string } = first(users);

console.log(firstWord);
console.log(firstFlag);
console.log(firstUser);

export {};
