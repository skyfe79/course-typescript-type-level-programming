// defaultColor는 colors에 맞는지 검사만 받으면 되는 자리다. 그런데 타입이 그냥 C였을 때는
// 이 자리도 C의 후보를 함께 던져서, 목록에 없는 색을 넘겨도 C가 그 색까지 받아들이도록 넓어졌다.
// NoInfer<C>는 그 자리를 후보 수집에서만 빼낸다. 검사는 그대로 받고, 런타임 동작도 전혀 바뀌지 않는다.
function createStreetLight<C extends string>(
  colors: C[],
  defaultColor?: NoInfer<C>,
): C[] {
  return colors;
}

// 앞 단계에서 조용히 통과하던 바로 그 호출이다. 이제는 거절당한다.
// C가 colors 세 값으로 먼저 정해지고, "blue"는 그 뒤에 검사만 받기 때문이다.
// const light = createStreetLight(["red", "yellow", "green"], "blue");
// error TS2345: Argument of type '"blue"' is not assignable to parameter of type '"green" | "red" | "yellow" | undefined'.

const fixedLight = createStreetLight(["red", "yellow", "green"], "yellow");

// C의 후보를 던지는 자리가 colors 하나뿐이라, 결과에는 실제 색 셋만 남는다.
// NoInfer<C>가 없던 앞 단계에서는 똑같이 생긴 이 줄이 거절당했고, 그때 오류 메시지는
// 넓어진 유니온을 그대로 출력했다 — Type '("blue" | "green" | "red" | "yellow")[]' is not assignable ...
const fixedColors: ("red" | "yellow" | "green")[] = fixedLight;

console.log(fixedColors);

export {};
