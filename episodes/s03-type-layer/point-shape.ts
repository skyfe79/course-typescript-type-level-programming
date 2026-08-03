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
