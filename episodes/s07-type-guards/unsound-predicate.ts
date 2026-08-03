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

export {};
