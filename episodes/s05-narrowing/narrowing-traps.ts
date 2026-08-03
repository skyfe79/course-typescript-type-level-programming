// 콜백 함정: value는 나중에 바뀔 수 있어 컴파일러가 콜백 안의 좁히기를 포기한다.
function runInCallback(input: string | undefined): void {
  let value = input;

  if (value !== undefined) {
    // setTimeout(() => console.log(value.toUpperCase()), 0);
    // error TS18048: 'value' is possibly 'undefined'.
    setTimeout(() => console.log("runInCallback:", String(value)), 0);
  }

  value = undefined;
}

// 클로저 함정: value는 나중에 바뀔 수 있어 컴파일러가 클로저 안의 좁히기를 포기한다.
function makeReader(input: string | undefined): () => string {
  let value = input;

  if (value !== undefined) {
    // return () => value.toUpperCase();
    // error TS18048: 'value' is possibly 'undefined'.
    return () => String(value);
  }

  value = undefined;
  return () => "";
}

interface Session {
  userId: string | undefined;
}

// 가변 필드 함정: userId는 나중에 바뀔 수 있어 컴파일러가 좁히기를 포기한다.
function useMutableField(session: Session): void {
  if (session.userId !== undefined) {
    // setTimeout(() => console.log(session.userId.toUpperCase()), 0);
    // error TS18048: 'session.userId' is possibly 'undefined'.
    setTimeout(() => console.log("useMutableField:", String(session.userId)), 0);

    session.userId = undefined;
    // console.log(session.userId.toUpperCase());
    // error TS18048: 'session.userId' is possibly 'undefined'.
    console.log("useMutableField after write:", String(session.userId));
  }
}

runInCallback("hello");
console.log("makeReader:", makeReader("hello")());
useMutableField({ userId: "u-1" });

export {};
