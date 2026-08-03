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
}

main();

export {};
