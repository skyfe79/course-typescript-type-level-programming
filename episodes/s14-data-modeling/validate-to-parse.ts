// boolean 검증은 검사했다는 사실을 타입에 남기지 못한다는 한계를 보여줍니다.
// parse 결과가 브랜드 타입 값을 돌려주면 검사의 증거가 함수 경계를 넘어 유지됩니다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s14-data-modeling/validate-to-parse.ts

// codeStep 207 — boolean 검증에서 증거를 지니는 parse로 전환

// 기존 방식 — 검사 결과가 boolean 하나로만 남는다
function isValidAge(input: unknown): boolean {
  return typeof input === "number" && Number.isInteger(input) && input >= 0 && input <= 150;
}

function registerUserOld(name: string, ageInput: unknown): string {
  if (!isValidAge(ageInput)) return "invalid age";
  // 여기서도 ageInput은 여전히 unknown이다 — 검사했다는 사실이 타입에 남지 않는다
  return `registered ${name}`;
}

// parse로 다시 쓴 버전
type Age = number & { readonly __brand: "Age" };
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function parseAge(input: unknown): Result<Age> {
  if (typeof input === "number" && Number.isInteger(input) && input >= 0 && input <= 150) {
    return { ok: true, value: input as Age };
  }
  return { ok: false, error: "invalid age" };
}

function registerUser(name: string, age: Age): string {
  return `registered ${name}, age ${age}`;
}

const parsed = parseAge(27);
if (parsed.ok) {
  console.log(registerUser("Ada", parsed.value));
}

export {};
