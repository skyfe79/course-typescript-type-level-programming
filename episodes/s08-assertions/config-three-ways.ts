type LogLevel = "debug" | "info" | "warn" | "error";

interface LogConfig {
  level: LogLevel;
  targets: string[];
}

const cfgAnnotated: LogConfig = {
  level: "info",
  targets: ["console", "file"],
};

const anyLevel: LogLevel = cfgAnnotated.level;

// 어노테이션은 객체를 검사하지만, 결과 타입은 LogConfig로 넓힌다.
// 그래서 실제 값이 "info"여도 level은 LogLevel 전체로 보인다.
// const exactAnnotated: "info" = cfgAnnotated.level;
// error TS2322: Type 'LogLevel' is not assignable to type '"info"'.
//   Type '"debug"' is not assignable to type '"info"'.

console.log("annotated", anyLevel, cfgAnnotated.targets.join(","));

function readLevelFromEnv(): string {
  return "verbose";
}

const cfgAsserted = {
  level: readLevelFromEnv(),
  targets: ["console", "file"],
} as LogConfig;

// as는 여기서 검사를 건너뛴다.
// 타입은 LogLevel이라고 말하지만, 실제 값은 네 가지 로그 레벨 중 어디에도 없다.
const assertedLevel: LogLevel = cfgAsserted.level;
console.log("asserted", assertedLevel);

const cfgSatisfied = {
  level: "info",
  targets: ["console", "file"],
} satisfies LogConfig;

const exactLevel: "info" = cfgSatisfied.level;

// satisfies는 검사하면서도 결과 타입을 원래 리터럴에 가깝게 남긴다.
// 그래서 level은 넓은 LogLevel이 아니라 좁은 "info"로 보인다.
console.log("satisfied", exactLevel, cfgSatisfied.targets.join(","));

// as가 조용히 통과시킨 같은 string 값은 satisfies 자리에서 바로 잡힌다.
// const cfgRejected = {
//   level: readLevelFromEnv(),
//   targets: ["console", "file"],
// } satisfies LogConfig;
// error TS2322: Type 'string' is not assignable to type 'LogLevel'.

export {};
