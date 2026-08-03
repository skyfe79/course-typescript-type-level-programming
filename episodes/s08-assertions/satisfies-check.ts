type ColorName = "red" | "green" | "blue";
type RGB = [number, number, number];

const paletteAnnotated: Record<ColorName, string | RGB> = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
};

console.log(paletteAnnotated.green);

// 값은 문자열인데 어노테이션이 타입을 string | RGB로 넓혀 버려 문자열 메서드를 부를 수 없다.
// paletteAnnotated.green.toUpperCase();
// error TS2339: Property 'toUpperCase' does not exist on type 'string | RGB'.
//   Property 'toUpperCase' does not exist on type 'RGB'.

const paletteChecked = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
} satisfies Record<ColorName, string | RGB>;

// satisfies는 검사하면서도 green을 string으로 남겨 문자열 메서드를 부를 수 있다.
const upperOk = paletteChecked.green.toUpperCase();
console.log(upperOk);

// satisfies는 결과 타입을 바꾸지 않으면서도 값을 실제로 검사한다. RGB는 정확히 세 자리다.
// const badPalette = {
//   red: [255, 0, 0],
//   green: "#00ff00",
//   blue: [0, 0, 255, 0],
// } satisfies Record<ColorName, string | RGB>;
// error TS2322: Type '[number, number, number, number]' is not assignable to type 'string | RGB'.
//   Type '[number, number, number, number]' is not assignable to type 'RGB'.
//     Source has 4 element(s) but target allows only 3.

export {};
