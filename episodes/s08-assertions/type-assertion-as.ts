type Cell = string | number;

function getCell(): Cell {
  return 42;
}

const raw = getCell();
const asNum = raw as number;

console.log(asNum.toFixed(2));

// 겹치는 구석이 없는 타입으로는 as 하나로 건너뛸 수 없다.
// const asBool = raw as boolean;
// error TS2352: Conversion of type 'Cell' to type 'boolean' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
//   Type 'number' is not comparable to type 'boolean'.

export {};
