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

export {};
