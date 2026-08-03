function pluckUnsafe(obj: any, key: string) {
  return obj[key];
}

const user = { name: "Ada", age: 36 };
const typo = pluckUnsafe(user, "nam");

console.log(typo);

function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const name: string = pluck(user, "name");
const age: number = pluck(user, "age");

console.log(name);
console.log(age);

// "nam"은 user에 없는 키라 K의 extends keyof T 제약을 어긴다.
// const bad = pluck(user, "nam");
// error TS2345: Argument of type '"nam"' is not assignable to parameter of type '"age" | "name"'.

export {};
