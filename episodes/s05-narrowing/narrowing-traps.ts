// 콜백 함정: value는 나중에 바뀔 수 있어 컴파일러가 콜백 안의 좁히기를 포기한다.
function runInCallback(input: string | undefined): void {
  let value = input;

  if (value !== undefined) {
    // const로 캡처한 값은 재할당할 수 없어 좁힌 타입이 지연된 코드 안에서도 유지된다.
    const narrowed = value;

    // setTimeout(() => console.log(value.toUpperCase()), 0);
    // error TS18048: 'value' is possibly 'undefined'.
    setTimeout(() => console.log("runInCallback:", narrowed.toUpperCase()), 0);
  }

  value = undefined;
}

// 클로저 함정: value는 나중에 바뀔 수 있어 컴파일러가 클로저 안의 좁히기를 포기한다.
function makeReader(input: string | undefined): () => string {
  let value = input;

  if (value !== undefined) {
    const narrowed = value;

    // return () => value.toUpperCase();
    // error TS18048: 'value' is possibly 'undefined'.
    return () => narrowed.toUpperCase();
  }

  value = undefined;
  return () => "";
}

// readonly는 그 필드를 재할당하는 코드 자체를 컴파일 에러로 만들어, 좁히기를 깨뜨리는 변경이
// 애초에 들어오지 못하게 한다.
interface Session {
  readonly userId: string | undefined;
}

// 가변 필드 함정: readonly로 막아도 콜백 안에서는 좁힌 정보가 남지 않는다 — 그 자리는 const
// 캡처가 복원하고, readonly는 아래의 쓰기를 막는다.
function useMutableField(session: Session): void {
  if (session.userId !== undefined) {
    const narrowed = session.userId;

    // setTimeout(() => console.log(session.userId.toUpperCase()), 0);
    // error TS18048: 'session.userId' is possibly 'undefined'.
    setTimeout(() => console.log("useMutableField:", narrowed.toUpperCase()), 0);

    // session.userId = undefined;
    // error TS2540: Cannot assign to 'userId' because it is a read-only property.

    // 쓰기가 막히니 이 아래 읽기에서는 좁힌 타입이 그대로 유지된다.
    console.log("useMutableField after write:", session.userId.toUpperCase());
  }
}

runInCallback("hello");
console.log("makeReader:", makeReader("hello")());
useMutableField({ userId: "u-1" });

export {};
