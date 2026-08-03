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
} as const;
const exactKind: "integer" = envSpec.PORT.kind;
const exactValues: readonly ["debug", "info", "warn", "error"] =
  envSpec.LOG_LEVEL.values;

// kind에 FieldSpec에 없는 값 "enumm"을 일부러 넣었는데, as const는 얼리기만 할 뿐 이 오타를 잡지 못한다.
const envSpecTypo = {
  HOST: { kind: "string" },
  PORT: { kind: "integer" },
  DEBUG: { kind: "boolean", default: false },
  LOG_LEVEL: {
    kind: "enumm",
    values: ["debug", "info", "warn", "error"],
    default: "info",
  },
} as const;
// 컴파일은 그대로 통과한다 — kind가 FieldSpec의 네 값 중 하나여야 한다는 것을 아무도 확인하지 않았다.
