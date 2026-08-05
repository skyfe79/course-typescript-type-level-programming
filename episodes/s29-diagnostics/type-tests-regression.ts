// 이 파일은 타입 테스트 하네스가 회귀를 잡는 순간을 보여 주려고 일부러 컴파일에 실패한다.
// 검사 실패가 곧 이 화의 결과이며, 루트 검사에서는 제외하고 옆의 전용 tsconfig로만 검사한다.

// codeStep 419 — 타입을 느슨하게 만든 회귀가 하네스를 깨뜨리는 순간 재현하기

// 브랜드 에러 타입은 하네스 파일과 똑같이 선언되어 있다. 그런데 아래에서 Lookup을 완화한 뒤로는
// 아무도 이 타입을 만들지 않는다. 선언은 그대로인데 아무도 만들지 않는 상태가 회귀의 모습이다.
interface TypeLevelError<Message extends string, Detail = unknown> {
  readonly __typeError: unique symbol;
  message: Message;
  detail: Detail;
}

// 거짓 분기를 any로 완화한 이 한 줄이 회귀 그 자체다. 이제 없는 키도 모든 타입에 대입된다.
type Lookup<T, K extends PropertyKey> = K extends keyof T ? T[K] : any;

function lookup<T extends object, K extends PropertyKey>(
  obj: T,
  key: K,
): Lookup<T, K> {
  if (key in obj) {
    return obj[key as unknown as keyof T] as Lookup<T, K>;
  }

  return { message: "KeyNotFound", detail: key } as unknown as Lookup<T, K>;
}

const row = { id: 1, name: "ada" };

// 하네스 파일의 단언을 그대로 옮겨 왔다. 완화하기 전이라면 이 대입에서 TS2322가 났겠지만,
// Lookup의 거짓 분기가 any가 된 지금은 어떤 타입에도 대입되어 그 오류가 나지 않는다.
// @ts-expect-error — 없는 키를 조회한 결과가 평범한 값 타입으로 흘러드는 것을 막는 단언이다.
const missingKey: string = lookup(row, "ghost");

export {};
