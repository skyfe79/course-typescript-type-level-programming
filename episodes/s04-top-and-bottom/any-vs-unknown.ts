function fetchRawConfig(): any {
  return { port: 8080 };
}

const rawConfig = fetchRawConfig();
const port = rawConfig.port;

// tsc는 통과하지만 실행하면 여기서 예외가 난다.
console.log(port.toUpperCase());
