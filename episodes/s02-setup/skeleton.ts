function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet(process.argv[2] ?? "TypeScript"));

// 일부러 에러 만들기
// console.log(greet(42)); // TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.
// String(42)로 문자열로 바꿔 수정
console.log(greet(String(42)));
