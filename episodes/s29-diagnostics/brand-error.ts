// 표준 라이브러리에는 이미 전역 TypeError 인터페이스가 있습니다. 모듈 안에서 같은 이름의
// 제네릭 인터페이스를 선언하면 전역 선언과 병합되지는 않지만, 전역 TypeError를 파일 전체에서
// 가려 진짜 런타임 에러 타입을 쓸 수 없습니다. 모듈이 아닌 파일이라면 전역 선언과 병합되어
// 타입 매개변수가 충돌합니다. 두 문제를 모두 피하려고 TypeLevelError라는 이름을 사용합니다.
interface TypeLevelError<Message extends string, Detail = unknown> {
  // unique symbol은 구조가 우연히 같은 평범한 객체와 이 에러 타입을 구별하는 브랜드입니다.
  readonly __typeError: unique symbol;
  message: Message;
  detail: Detail;
}

// 키가 있으면 해당 값의 타입을, 없으면 never 대신 읽을 수 있는 실패 정보를 돌려줍니다.
type Lookup<T, K extends PropertyKey> =
  K extends keyof T ? T[K] : TypeLevelError<"KeyNotFound", K>;

function lookup<T extends object, K extends PropertyKey>(
  obj: T,
  key: K,
): Lookup<T, K> {
  if (key in obj) {
    // 런타임 검사로 키의 존재를 확인했지만, 제네릭 조건부 타입의 어느 분기인지는
    // 컴파일러가 확정하지 못합니다. any를 쓰지 않고 실제 객체의 키로 접근한 뒤 단언합니다.
    return obj[key as unknown as keyof T] as Lookup<T, K>;
  }

  // __typeError는 타입에서만 쓰는 브랜드이므로 런타임 객체에는 만들지 않습니다.
  // 따라서 실제로 필요한 message와 detail만 만든 뒤 unknown을 거쳐 반환 타입으로 단언합니다.
  return { message: "KeyNotFound", detail: key } as unknown as Lookup<T, K>;
}

const row = { id: 1, name: "ada" };

console.log(lookup(row, "name"));
console.log(lookup(row, "ghost"));

// 이 파일의 타입 이름이 다른 화의 전역 선언과 섞이지 않도록 모듈 범위로 격리합니다.
export {};
