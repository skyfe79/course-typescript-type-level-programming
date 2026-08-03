interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  side: number;
}

// 두 타입 중 하나인 값의 집합
type Figure = Circle | Square;

function label(figure: Figure): string {
  return figure.kind; // 양쪽에 모두 있는 프로퍼티라 접근된다
}

// 아래 함수의 주석을 해제하면, Square에는 radius가 없어 컴파일 에러가 난다
// function brokenArea(figure: Figure): number {
//   return Math.PI * figure.radius ** 2;
// }

console.log(label({ kind: "circle", radius: 3 }));
console.log(label({ kind: "square", side: 4 }));

// 양쪽에 모두 속하는 값의 집합 — 겹치는 값이 없어 비어 있다
type Impossible = string & number; // 호버: never

// 아래 줄의 주석을 해제하면, 이 타입을 만족하는 값이 없어 컴파일 에러가 난다
// const nothing: Impossible = "hello";
