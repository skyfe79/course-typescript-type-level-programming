function fail(message: string) {
  throw new Error(message);
}

function getStatusLabel(code: number): string {
  if (code === 200) return "OK";
  if (code === 404) return "Not Found";

  // 어노테이션 없는 함수 선언 fail의 반환 타입은 void로 추론된다.
  // return fail(`Unknown status code: ${code}`);
  // error TS2322: Type 'void' is not assignable to type 'string'.
  throw new Error(`Unknown status code: ${code}`);
}

console.log(getStatusLabel(200));
console.log(getStatusLabel(404));
