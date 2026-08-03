function isNonEmptyString(value: unknown): value is string {
  if (value === null || value === undefined) {
    return false;
  }

  const asText = String(value);
  const trimmed = asText.trim();

  return trimmed.length > 0;
}

console.log(isNonEmptyString("hello"));    // true
console.log(isNonEmptyString(""));         // false
console.log(isNonEmptyString(null));       // false
console.log(isNonEmptyString(undefined));  // false

console.log(isNonEmptyString(42)); // true — 그러나 42는 문자열이 아니다

function shout(input: unknown): string {
  if (isNonEmptyString(input)) {
    return input.toUpperCase(); // input은 이제 컴파일러 눈에 string
  }
  return "(빈 값)";
}

console.log(shout(42)); // 컴파일은 통과, 런타임에서 TypeError

export {};
