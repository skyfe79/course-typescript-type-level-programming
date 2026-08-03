function assertNonEmpty(value: string | undefined, label: string): asserts value is string {
  if (value === undefined || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

export {};
