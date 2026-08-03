interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  side: number;
}

type Shape = Circle | Square;

function describeShape(shape: Shape): string {
  switch (shape.kind) {
    case "circle":
      // switch 하나로 shape는 Circle 하나로 좁혀진다.
      return `circle r=${shape.radius}`;
    case "square":
      return `square s=${shape.side}`;
  }
}

console.log(describeShape({ kind: "circle", radius: 2 }));
console.log(describeShape({ kind: "square", side: 3 }));

export {};
