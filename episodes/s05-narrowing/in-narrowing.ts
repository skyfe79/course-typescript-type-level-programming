type Shape = { radius: number } | { width: number; height: number };

function describeShape(shape: Shape): string {
  if ("radius" in shape) {
    return `circle area: ${(Math.PI * shape.radius ** 2).toFixed(2)}`;
  } else {
    return `rect area: ${shape.width * shape.height}`;
  }
}

console.log(describeShape({ radius: 3 }));
console.log(describeShape({ width: 4, height: 5 }));

// import도 export도 없는 파일은 전역 타입 공간을 공유해, 다른 화의 Shape와 이름이 부딪힌다.
// 이 한 줄이 파일을 모듈로 만들어 Shape를 이 파일 안에 가둔다.
export {};
