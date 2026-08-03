function safeParse(rawInput: string): unknown {
  try {
    return JSON.parse(rawInput);
  } catch (e) {
    // 여기서 e에 마우스를 올리면 타입이 unknown으로 뜬다.
    // 아래 줄의 주석을 해제하면, e가 unknown 타입이어서 컴파일 에러가 난다.
    // console.error(e.message);
    if (e instanceof Error) {
      console.error("parse failed:", e.message);
    }
    throw e;
  }
}

safeParse("not json");
