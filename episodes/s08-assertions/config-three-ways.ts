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

export {};
