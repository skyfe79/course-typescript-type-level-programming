function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet(process.argv[2] ?? "TypeScript"));
