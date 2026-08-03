function safeParse(rawInput: string): unknown {
  try {
    const parsed: unknown = JSON.parse(rawInput);
    if (parsed === null) {
      throw "설정 값이 null입니다";
    }
    return parsed;
  } catch (e) {
    // 여기서 e에 마우스를 올리면 타입이 unknown으로 뜬다.
    // 아래 줄의 주석을 해제하면, e가 unknown 타입이어서 컴파일 에러가 난다.
    // console.error(e.message);
    if (e instanceof Error) {
      console.error("parse failed:", e.message);
    } else {
      console.error("parse failed with non-Error throw:", String(e));
    }
    throw e;
  }
}

for (const rawInput of ["not json", "null"]) {
  try {
    safeParse(rawInput);
  } catch {
    // safeParse가 이미 로그를 남겼으므로, 여기서는 다음 입력으로 넘어간다.
  }
}
