function describeLength<T extends { length: number }>(value: T): string {
  return `길이는 ${value.length}입니다`;
}

const stringLength = describeLength("hello");
const arrayLength = describeLength([1, 2, 3]);

console.log(stringLength);
console.log(arrayLength);

// number에는 length 프로퍼티가 없어 extends { length: number } 제약을 어긴다.
// describeLength(42);
// error TS2345: Argument of type 'number' is not assignable to parameter of type '{ length: number; }'.

export {};
