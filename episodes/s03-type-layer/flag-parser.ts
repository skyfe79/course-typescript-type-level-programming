type Mode = "prod" | "staging" | "dev";

const m1: Mode = "prod";

// 아래 줄의 주석을 해제하면 타입 불일치 에러가 난다
// const m2: Mode = "test";

console.log(m1);

function parseMode(raw: string): Mode {
  if (raw === "prod" || raw === "staging" || raw === "dev") {
    return raw;
  }
  throw new Error(`알 수 없는 --mode 값: ${raw}`);
}

const modeArg = process.argv[2]?.replace("--mode=", "") ?? "dev";
const mode: Mode = parseMode(modeArg);
console.log(`현재 모드: ${mode}`);
