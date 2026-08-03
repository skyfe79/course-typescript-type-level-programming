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

// 아래 줄처럼 기본값에 오타를 내면, 실행해 보기도 전에 컴파일 에러가 난다
// const brokenFallback: Mode = "dve";
const fallback: Mode = "dev";

const modeArg = process.argv[2]?.replace("--mode=", "") ?? fallback;
const mode: Mode = parseMode(modeArg);
console.log(`현재 모드: ${mode}`);
