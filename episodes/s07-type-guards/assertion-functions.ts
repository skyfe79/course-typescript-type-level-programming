interface User {
  id: number;
  name: string;
}

function assertDefined<T>(value: T, label: string): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(`${label} is null or undefined`);
  }
}

export {};
