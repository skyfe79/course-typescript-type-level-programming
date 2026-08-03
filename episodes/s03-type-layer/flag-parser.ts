type Mode = "prod" | "staging" | "dev";

const m1: Mode = "prod";

// 아래 줄의 주석을 해제하면 타입 불일치 에러가 난다
// const m2: Mode = "test";

console.log(m1);
