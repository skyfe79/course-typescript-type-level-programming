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
};
// envSpec.PORT.kind는 "integer"가 아니라 넓은 string으로 추론된다.
const widenedKind: string = envSpec.PORT.kind;
// envSpec.LOG_LEVEL.values도 정확한 네 문자열 튜플이 아니라 string[]로 추론된다.
const widenedValues: string[] = envSpec.LOG_LEVEL.values;
