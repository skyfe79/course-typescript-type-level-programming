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
