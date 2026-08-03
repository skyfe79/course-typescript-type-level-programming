interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  side: number;
}

interface Triangle {
  kind: "triangle";
  base: number;
  height: number;
}

type Shape = Circle | Square | Triangle;

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.side ** 2;
    // default: {
    //   // 모든 경우를 소진했으므로 shape는 never이며, 이 대입이 완전성을 증명한다.
    //   const exhaustiveCheck: never = shape;
    //   throw new Error(`unhandled shape: ${exhaustiveCheck}`);
    // }
    // never 대입을 그대로 두었다면 Triangle을 빠뜨린 것이 컴파일 에러로 잡힌다.
    // error TS2322: Type 'Triangle' is not assignable to type 'never'.
    default:
      // Triangle이 이 분기로 흘러 들어가 조용히 0이 된다.
      return 0;
  }
}

console.log(area({ kind: "circle", radius: 2 }));
console.log(area({ kind: "square", side: 3 }));
console.log(area({ kind: "triangle", base: 4, height: 5 }));

export {};
