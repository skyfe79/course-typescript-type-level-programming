// `@ts-expect-error`를 타입 단언으로 사용하는 타입 테스트 하네스다.
// 실행: node episodes/s29-diagnostics/type-tests.ts
// 검사: npx tsc --noEmit
// 런타임 테스트와 달리 이 파일은 컴파일된다는 사실 자체가 통과를 뜻한다.

// codeStep 418 — 실패해야 할 호출을 타입 단언으로 표시하기

// 화별 파일은 서로 import하지 않으므로, ep_189의 brand-error.ts에서 이 하네스의
// 검증에 필요한 TypeLevelError, Lookup, lookup만 최소한으로 다시 정의한다.
interface TypeLevelError<Message extends string, Detail = unknown> {
  // unique symbol 브랜드가 평범한 객체와 타입 레벨 에러를 구별한다.
  readonly __typeError: unique symbol;
  message: Message;
  detail: Detail;
}

// 키가 있으면 값의 타입을, 없으면 읽을 수 있는 실패 정보를 돌려준다.
type Lookup<T, K extends PropertyKey> =
  K extends keyof T ? T[K] : TypeLevelError<"KeyNotFound", K>;

function lookup<T extends object, K extends PropertyKey>(
  obj: T,
  key: K,
): Lookup<T, K> {
  if (key in obj) {
    // 런타임 검사는 키의 존재를 알지만 제네릭 조건부 타입의 분기까지 좁히지는 못한다.
    return obj[key as unknown as keyof T] as Lookup<T, K>;
  }

  // 브랜드는 타입에서만 필요하므로 런타임 객체에는 실패 정보만 담는다.
  return { message: "KeyNotFound", detail: key } as unknown as Lookup<T, K>;
}

const row = { id: 1, name: "ada" };

// 없는 키가 평범한 값 타입으로 흘러드는 회귀를 막는 단언이다.
// @ts-expect-error — "ghost"는 row에 없는 키라 Lookup이 string이 아니라 TypeLevelError를 돌려준다.
const missingKey: string = lookup(row, "ghost");
// 이 지시문은 원래 이 대입 자리에서 발생할 TS2322를 소비한다. 그 오류가 사라지면 TS2578이 난다.

console.log("타입 테스트 하네스가 컴파일되었습니다.");

// 이 파일의 타입 이름이 다른 화의 전역 선언과 섞이지 않도록 모듈 범위로 격리한다.
export {};
