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

interface BrokenCircle {
  kind: string;
  radius: number;
}

interface BrokenSquare {
  kind: string;
  side: number;
}

type BrokenShape = BrokenCircle | BrokenSquare;

function describeBrokenShape(shape: BrokenShape): string {
  switch (shape.kind) {
    case "circle":
      // kind: string이라 여기서도 shape는 BrokenCircle | BrokenSquare 전체로 남는다.
      // return `circle r=${shape.radius}`;
      // error TS2339: Property 'radius' does not exist on type 'BrokenShape'.
      //   Property 'radius' does not exist on type 'BrokenSquare'.
      return `circle kind=${shape.kind}`;
    case "square":
      // return `square s=${shape.side}`;
      // error TS2339: Property 'side' does not exist on type 'BrokenShape'.
      //   Property 'side' does not exist on type 'BrokenCircle'.
      return `square kind=${shape.kind}`;
  }
  return "unknown";
}

console.log(describeBrokenShape({ kind: "circle", radius: 2 }));
console.log(describeBrokenShape({ kind: "square", side: 3 }));

export {};
