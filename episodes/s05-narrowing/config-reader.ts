interface RawConfig {
  host: string | undefined;
  port: string | undefined;
  timeoutMs: string | undefined;
}

function readRawConfig(): RawConfig {
  return {
    host: process.env.HOST,
    port: process.env.PORT,
    timeoutMs: process.env.TIMEOUT_MS,
  };
}

function loadConfig() {
  const raw = readRawConfig();
  const host = raw.host ?? "localhost";
  const port = raw.port ?? "8080";
  const timeoutMs = raw.timeoutMs ?? "5000";
  // 여기서 host를 호버하면 string이다 — undefined가 제거됐다.
  return { host, port, timeoutMs };
}

function describeConfig(config: { host: string; port: string; timeoutMs: string }): string {
  return `${config.host.toUpperCase()}:${config.port} (timeout ${config.timeoutMs}ms)`;
}

const config = loadConfig();
// 여기서 config를 호버하면 세 필드가 전부 string이다 — string | undefined가 사라졌다.
console.log(describeConfig(config));

export {};
