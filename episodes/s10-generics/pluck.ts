function pluckUnsafe(obj: any, key: string) {
  return obj[key];
}

const user = { name: "Ada", age: 36 };
const typo = pluckUnsafe(user, "nam");

console.log(typo);

export {};
