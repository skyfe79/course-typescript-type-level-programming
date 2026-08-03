const modeConst = "prod"; // 호버: "prod"
let modeLet = "prod"; // 호버: string

function requireProd(mode: "prod"): void {
  console.log(`${mode} 모드로 시작합니다.`);
}

requireProd(modeConst);

// 아래 줄의 주석을 해제하면 타입 불일치 에러가 난다
// requireProd(modeLet);

console.log(modeConst, modeLet);

const config = { mode: "prod" }; // config.mode: string (넓혀짐)

// 아래 줄의 주석을 해제하면 타입 불일치 에러가 난다
// requireProd(config.mode);

const configFixed = { mode: "prod" } as const; // configFixed.mode: "prod"
requireProd(configFixed.mode);
console.log(config.mode, configFixed.mode);
