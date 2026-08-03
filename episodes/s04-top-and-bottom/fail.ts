function fail(message: string): never {
  // return "unreachable";
  // error TS2322: Type '"unreachable"' is not assignable to type 'never'.
  throw new Error(message);
}

function getStatusLabel(code: number): string {
  if (code === 200) return "OK";
  if (code === 404) return "Not Found";

  // fail(...)의 never는 string 반환 자리에 들어맞는다.
  return fail(`Unknown status code: ${code}`);
}

console.log(getStatusLabel(200));
console.log(getStatusLabel(404));
