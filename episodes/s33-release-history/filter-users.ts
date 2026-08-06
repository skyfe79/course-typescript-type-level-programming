// STEP 504 — 명시적 타입 가드와 추론된 타입 술어로 사용자 배열의 빈 값 걸러 내기

// 저장소 전체를 검사할 때 다른 에피소드의 같은 이름 선언과 합쳐지지 않도록
// 이 파일만의 모듈 스코프를 만듭니다. 아래 예제의 실행 결과에는 영향을 주지 않습니다.
export {};

// 화별 파일은 다른 화를 가져오지 않고도 혼자 읽고 실행할 수 있어야 합니다.
// 따라서 legacy-service.ts에서 User를 가져오지 않고 이 예제에 필요한 모양을 여기서 다시 선언합니다.
interface User {
  id: number;
  name: string;
}

// 실제 API 응답이나 오래된 서비스의 데이터에는 정상 사용자 사이에 null과 undefined가 섞일 수 있습니다.
const rawList: (User | null | undefined)[] = [
  { id: 1, name: "Ada" },
  null,
  { id: 2, name: "Grace" },
  undefined,
];

// TypeScript 1.6부터 쓰던 방식에서는 filter 뒤의 원소 타입을 User로 좁히기 위해 타입 술어를 직접 적습니다.
// 반환 타입의 `value is User`가 true일 때 value를 User로 취급해도 된다고 타입 체커에 알려 줍니다.
function isPresent(value: User | null | undefined): value is User {
  return value != null;
}

const filteredOld: User[] = rawList.filter(isPresent);

// TypeScript 5.5는 함수 본문이 매개변수를 어떻게 좁히는지 분석해 타입 술어를 추론할 수 있습니다.
// `value != null`은 null과 undefined를 함께 제외하므로 별도의 `is` 절 없이도 결과가 User[]가 됩니다.
const filteredNew = rawList.filter((value) => value != null);

// 아래 대입이 컴파일된다는 사실로 filteredNew의 추론 결과가 실제 User[]임을 검사합니다.
const filteredNewTyped: User[] = filteredNew;

// 술어 추론은 콜백이 매개변수 자체를 특정 타입으로 좁힐 때만 일어납니다.
// 이름을 Boolean으로 바꾸는 아래 콜백은 참과 거짓을 반환하지만 value가 User라는 술어는 만들지 않습니다.
const filteredByTruthyName = rawList.filter((value) => Boolean(value?.name));
// const filteredByTruthyNameTyped: User[] = filteredByTruthyName; // ← TS2322: Type '(User | null | undefined)[]' is not assignable to type 'User[]' (실제 메시지는 undefined가 User에 대입되지 않는다는 이유까지 두 줄 더 보여 줍니다).

// const 타입 매개변수는 제네릭 호출에서 리터럴 추론을 보존하지만, 여기에는 리터럴을 받는 제네릭 함수가 없습니다.
// 표준 데코레이터는 클래스와 멤버에 동작을 덧붙이지만, 여기에는 꾸밀 클래스나 멤버가 없습니다.
// using 선언은 Symbol.dispose 자원을 스코프 끝에서 정리하지만, 이 배열에는 해제할 자원이 없습니다.
// NoInfer<T>는 특정 위치가 제네릭 타입 추론에 관여하지 못하게 하지만, 여기에는 조정할 제네릭 추론이 없습니다.

function main() {
  const oldNames = filteredOld.map((user) => user.name).join(", ");
  const newNames = filteredNewTyped.map((user) => user.name).join(", ");
  const sameResult = oldNames === newNames && filteredOld.length === filteredNewTyped.length;

  console.log(`1.6 explicit guard: ${filteredOld.length} -> ${oldNames}`);
  console.log(`5.5 inferred predicate: ${filteredNewTyped.length} -> ${newNames}`);
  console.log(`same result: ${sameResult}`);
}

main();
