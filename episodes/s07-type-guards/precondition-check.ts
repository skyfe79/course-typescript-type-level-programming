function assertNonEmpty(value: string | undefined, label: string): asserts value is string {
  if (value === undefined || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function main() {
  const name = process.argv.at(2);
  assertNonEmpty(name, "name");

  console.log(name.trim().toUpperCase());
  console.log(`Length: ${name.length}`);

  for (let i = 0; i < name.length; i++) {
    console.log(`${i}: ${name[i]}`);
  }
}

main();

// assertNonEmpty 호출을 지우면 그 아래 네 줄이 전부 컴파일되지 않는다.
// function mainWithoutAssert() {
//   const name = process.argv.at(2);
//   console.log(name.trim().toUpperCase());
//   console.log(`Length: ${name.length}`);
//   for (let i = 0; i < name.length; i++) {
//     console.log(`${i}: ${name[i]}`);
//   }
// }
// error TS18048: 'name' is possibly 'undefined'.  (네 곳 모두)

export {};
