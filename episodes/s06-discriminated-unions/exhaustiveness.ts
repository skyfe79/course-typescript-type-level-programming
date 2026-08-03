interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  side: number;
}

type Shape = Circle | Square;

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.side ** 2;
    default: {
      // 모든 경우를 소진했으므로 shape는 never이며, 이 대입이 완전성을 증명한다.
      const exhaustiveCheck: never = shape;
      throw new Error(`unhandled shape: ${exhaustiveCheck}`);
    }
  }
}

console.log(area({ kind: "circle", radius: 2 }));
console.log(area({ kind: "square", side: 3 }));

export {};
