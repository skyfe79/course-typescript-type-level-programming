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

export {};
