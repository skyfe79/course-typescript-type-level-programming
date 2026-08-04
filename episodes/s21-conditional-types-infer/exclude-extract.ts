// 조건부 타입의 분산으로 Exclude와 Extract를 직접 구현해 표준 라이브러리와 대조한다.
// 실행: node episodes/s21-conditional-types-infer/exclude-extract.ts
// 검사: npx tsc --noEmit

// MyExclude<T, U>는 T가 extends 왼쪽에 벗겨진 채로 있으므로 지난 화의 분산 규칙이 그대로 적용된다.
// 조건에 걸린 멤버는 never가 되고, never는 유니온에서 조용히 사라져 남길 멤버만 자동으로 남는다.
type MyExclude<T, U> = T extends U ? never : T;

// 비교할 재료를 문자열 리터럴 유니온으로 두면 분산 결과가 각 과일 멤버별로 눈에 보인다.
// "apple"만 제외할 때 나머지 두 멤버가 그대로 남아야 한다.
type Fruit = "apple" | "banana" | "cherry";
type NoApple = MyExclude<Fruit, "apple">;   // "banana" | "cherry"

// 함수 매개변수에 NoApple을 쓰면 제외된 멤버가 실제 호출에서 막히는지 확인할 수 있다.
// 타입은 컴파일 시간에 검사되고, 통과한 값만 런타임 출력으로 이어진다.
function acceptNoApple(value: NoApple): void {
  console.log(`허용: ${value}`);
}

acceptNoApple("banana");
// 주석을 풀면 error TS2345: Argument of type '"apple"' is not assignable to parameter of type 'NoApple'. 오류가 난다.
// acceptNoApple("apple"); // 컴파일 오류 — "apple"은 NoApple에서 이미 걸러졌다

// MyExtract<T, U>는 MyExclude와 조건문의 참·거짓 분기만 뒤바뀐 형태다.
// 조건에 맞는 멤버는 T로 보존하고, 맞지 않는 멤버는 never로 지워 필요한 멤버만 모은다.
type MyExtract<T, U> = T extends U ? T : never;

// 같은 Fruit 유니온에서 두 멤버를 뽑으면 분산된 각 검사 결과가 다시 유니온으로 합쳐진다.
// "cherry"는 never가 되어 사라지고 "apple"과 "banana"만 남는다.
type AppleOrBanana = MyExtract<Fruit, "apple" | "banana">;   // "apple" | "banana"

// 함수 매개변수에 AppleOrBanana를 쓰면 추출되지 않은 멤버가 호출 단계에서 막히는지 볼 수 있다.
// 이 값도 타입 검사를 통과한 뒤에만 런타임 출력으로 이어진다.
function acceptAppleOrBanana(value: AppleOrBanana): void {
  console.log(`허용: ${value}`);
}

acceptAppleOrBanana("apple");
// 주석을 풀면 error TS2345: Argument of type '"cherry"' is not assignable to parameter of type 'AppleOrBanana'. 오류가 난다.
// acceptAppleOrBanana("cherry"); // 컴파일 오류 — "cherry"는 AppleOrBanana에 남지 않았다

// 한쪽 방향 대입만으로는 직접 만든 타입이 표준 타입에 포함된다는 사실까지만 확인된다.
// 양쪽 모두 대입되어야 서로 빠진 멤버가 없는 같은 타입이라고 볼 수 있다.
const libraryExclude: Exclude<Fruit, "apple"> = "banana";
const mineExclude: NoApple = libraryExclude;
const backToLibraryExclude: Exclude<Fruit, "apple"> = mineExclude;

// Extract도 같은 방식으로 표준 타입에서 직접 만든 타입으로, 다시 표준 타입으로 값을 옮긴다.
// 두 방향 대입이 모두 통과하면 "apple" | "banana"라는 결과가 서로 같다는 뜻이다.
const libraryExtract: Extract<Fruit, "apple" | "banana"> = "apple";
const mineExtract: AppleOrBanana = libraryExtract;
const backToLibraryExtract: Extract<Fruit, "apple" | "banana"> = mineExtract;

// backToLibraryExclude와 backToLibraryExtract는 대입 자체가 검사이므로 값을 다시 쓰지 않는다.
// 런타임에서는 앞의 호출 두 개와 최종 확인 메시지만 출력한다.
console.log("Exclude와 Extract 직접 구현이 표준 라이브러리와 일치합니다.");

export {};
