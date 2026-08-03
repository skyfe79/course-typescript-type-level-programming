function tag<T>(theme: T): T {
  return theme;
}

// 리터럴을 그대로 적은 객체를 넘겼는데, T는 그 안의 "red"를 string으로 넓혀서 받는다.
// 이건 tag의 잘못이 아니라 컴파일러의 정상적인 기본 동작이다.
const widened = tag({ color: "red" });

// 넓어졌다는 증거다. color가 "red"여야 하는 자리에는 들어가지 못한다.
// const widenedLiteral: { readonly color: "red" } = widened;
// error TS2322: Type '{ color: string; }' is not assignable to type '{ readonly color: "red"; }'.

// 지금 리터럴을 지키는 방법은 호출하는 쪽에서 직접 as const를 적는 것 하나뿐이다.
// 리터럴을 지키려는 호출자가 매번 이걸 기억해야 하고, 잊어도 컴파일러는 알려 주지 않는다.
const withAsConst = tag({ color: "red" } as const);
const keptByCaller: { readonly color: "red" } = withAsConst;

console.log(widened.color, keptByCaller.color);

export {};
