fn factorial(n: number): number {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

fn gcd(a: number, b: number): number {
  if (b == 0) {
    return a;
  }
  return gcd(b, a % b);
}

fn fibonacci(n: number): number {
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

print(factorial(10));
print(gcd(48, 18));
print(fibonacci(10));
