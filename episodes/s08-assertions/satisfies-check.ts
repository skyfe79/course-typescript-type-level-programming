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

export {};
