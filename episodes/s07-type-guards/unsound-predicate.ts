function isNonEmptyString(value: unknown): value is string {
  if (value === null || value === undefined) {
    return false;
  }

  const asText = String(value);
  const trimmed = asText.trim();

  return trimmed.length > 0;
}

export {};
