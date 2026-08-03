type FieldSpec =
  | { kind: "string"; default?: string }
  | { kind: "integer"; default?: number }
  | { kind: "boolean"; default?: boolean }
  | { kind: "enum"; values: readonly string[]; default?: string };

type EnvSpec = Record<string, FieldSpec>;

type FieldOutcome =
  | { kind: "valid"; name: string }
  | { kind: "defaulted"; name: string }
  | { kind: "missing"; name: string }
  | { kind: "invalid"; name: string; raw: string };

interface EnvConfig {
  HOST: string;
  PORT: number;
  DEBUG: boolean;
  LOG_LEVEL: "debug" | "info" | "warn" | "error";
}

interface EnvReport {
  outcomes: FieldOutcome[];
  ok: boolean;
}

const envSpec = {
  HOST: { kind: "string" },
  PORT: { kind: "integer" },
  DEBUG: { kind: "boolean", default: false },
  LOG_LEVEL: {
    kind: "enum",
    values: ["debug", "info", "warn", "error"],
    default: "info",
  },
} as const satisfies EnvSpec;
const exactKind: "integer" = envSpec.PORT.kind;

// as const가 조용히 통과시킨 같은 실수는 satisfies 자리에서 잡힌다.
// const envSpecTypoChecked = {
//   HOST: { kind: "string" },
//   PORT: { kind: "integer" },
//   DEBUG: { kind: "boolean", default: false },
//   LOG_LEVEL: {
//     kind: "enumm",
//     values: ["debug", "info", "warn", "error"],
//     default: "info",
//   },
// } as const satisfies EnvSpec;
// error TS2820: Type '"enumm"' is not assignable to type '"boolean" | "enum" | "integer" | "string"'. Did you mean '"enum"'?

function isNonEmptyString(raw: string): raw is string {
  return raw.length > 0;
}

function isIntegerString(raw: string): raw is string {
  return /^-?\d+$/.test(raw);
}

function isBooleanString(raw: string): raw is "true" | "false" {
  return raw === "true" || raw === "false";
}

function isLogLevel(raw: string): raw is "debug" | "info" | "warn" | "error" {
  return (envSpec.LOG_LEVEL.values as readonly string[]).includes(raw);
}

const outcomes: FieldOutcome[] = [];

const rawHost = process.env.HOST;
let hostValue = "";
if (rawHost === undefined) {
  outcomes.push({ kind: "missing", name: "HOST" });
} else if (isNonEmptyString(rawHost)) {
  hostValue = rawHost;
  outcomes.push({ kind: "valid", name: "HOST" });
} else {
  outcomes.push({ kind: "invalid", name: "HOST", raw: rawHost });
}

const rawPort = process.env.PORT;
let portValue = 0;
if (rawPort === undefined) {
  outcomes.push({ kind: "missing", name: "PORT" });
} else if (isIntegerString(rawPort)) {
  portValue = Number(rawPort);
  outcomes.push({ kind: "valid", name: "PORT" });
} else {
  outcomes.push({ kind: "invalid", name: "PORT", raw: rawPort });
}

const rawDebug = process.env.DEBUG;
let debugValue = false;
if (rawDebug === undefined) {
  debugValue = envSpec.DEBUG.default ?? false;
  outcomes.push({ kind: "defaulted", name: "DEBUG" });
} else if (isBooleanString(rawDebug)) {
  debugValue = rawDebug === "true";
  outcomes.push({ kind: "valid", name: "DEBUG" });
} else {
  debugValue = envSpec.DEBUG.default ?? false;
  outcomes.push({ kind: "invalid", name: "DEBUG", raw: rawDebug });
}

const rawLogLevel = process.env.LOG_LEVEL;
let logLevelValue: "debug" | "info" | "warn" | "error" = envSpec.LOG_LEVEL.default ?? "info";
if (rawLogLevel === undefined) {
  outcomes.push({ kind: "defaulted", name: "LOG_LEVEL" });
} else if (isLogLevel(rawLogLevel)) {
  logLevelValue = rawLogLevel;
  outcomes.push({ kind: "valid", name: "LOG_LEVEL" });
} else {
  outcomes.push({ kind: "invalid", name: "LOG_LEVEL", raw: rawLogLevel });
}
// HOST·PORT는 기본값이 없으므로 앞 절의 missing 처리를 그대로 둔다

console.log(outcomes);
console.log(debugValue, logLevelValue);
