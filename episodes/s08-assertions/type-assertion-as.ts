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

type Row = { cells: string[] };

const raw2 = getCell();

// 한 번에 가려고 하면 여기서도 막힌다.
// const asRowDirect = raw2 as Row;
// error TS2352: Conversion of type 'Cell' to type 'Row' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
//   Type 'number' is not comparable to type 'Row'.

const asRow = raw2 as unknown as Row;

console.log(asRow.cells.length);

export {};
