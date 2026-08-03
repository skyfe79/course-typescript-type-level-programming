function fetchRawConfig(): unknown {
  return { port: 8080 };
}

const rawConfig = fetchRawConfig();

// 아래 줄의 주석을 해제하면, rawConfig가 unknown 타입이어서 컴파일 에러가 난다.
// const port = rawConfig.port;

if (
  typeof rawConfig === "object" &&
  rawConfig !== null &&
  "port" in rawConfig &&
  typeof rawConfig.port === "number"
) {
  const port = rawConfig.port;
  console.log(port.toFixed(0));
}
