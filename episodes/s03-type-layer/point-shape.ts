/*
실제 TypeScript 에러 메시지
interface: error TS2741: Property 'y' is missing in type '{ x: number; }' but required in type 'PointI'.
type:      error TS2741: Property 'y' is missing in type '{ x: number; }' but required in type 'PointT'.
-> 에러 코드도 문장도 같고, 찍히는 타입 이름만 다르다
*/

interface PointI {
  x: number;
  y: number;
}

const validI: PointI = { x: 1, y: 2 };

// 아래 줄의 주석을 해제하면 y가 없어 에러가 난다
// const brokenI: PointI = { x: 1 };

type PointT = {
  x: number;
  y: number;
};

const validT: PointT = { x: 1, y: 2 };

// 아래 줄의 주석을 해제하면 y가 없어 에러가 난다
// const brokenT: PointT = { x: 1 };

console.log(validI, validT);
