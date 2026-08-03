function describeLength<T extends { length: number }>(value: T): string {
  return `길이는 ${value.length}입니다`;
}

const stringLength = describeLength("hello");
const arrayLength = describeLength([1, 2, 3]);

console.log(stringLength);
console.log(arrayLength);

export {};
