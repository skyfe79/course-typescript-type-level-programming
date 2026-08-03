class ParseError extends Error {}

function describeError(e: unknown): string {
  if (e instanceof ParseError) {
    return `parse error: ${e.message}`;
  } else if (e instanceof Error) {
    return `error: ${e.message}`;
  }
  return "unknown throw";
}

console.log(describeError(new ParseError("bad token")));
