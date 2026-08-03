// const 타입 매개변수는 이 자리의 기본 추론을 가장 좁은 타입으로 바꾼다.
// 호출자가 기억해야 할 새 문법이 아니라, 선언 한 곳에서 정해지는 기본 동작이다.
function tag<const T>(theme: T): T {
  return theme;
}

// 앞 단계와 글자 하나 다르지 않은 호출이다. 선언 쪽에 const를 붙인 것만으로 결과가 달라진다.
const kept = tag({ color: "red" });

// 앞 단계에서는 똑같이 생긴 이 줄이 거절당했다. 그때 오류는 이랬다.
// error TS2322: Type '{ color: string; }' is not assignable to type '{ readonly color: "red"; }'.
const keptLiteral: { readonly color: "red" } = kept;

// 앞 단계에서 호출자가 손으로 적어야 했던 as const는 이제 없어도 된다. 적어도 결과는 같다.
const stillLiteral: { readonly color: "red" } = tag({ color: "red" } as const);

console.log(keptLiteral.color, stillLiteral.color);

export {};
