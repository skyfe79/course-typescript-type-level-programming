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
