type Config = {
  server?: {
    hosts?: string[];
    getPort?: () => number;
  };
};

const config: Config = { server: { hosts: ["a.example.com", "b.example.com"] } };

const firstHost = config.server?.hosts?.[0];   // 여기서 firstHost를 호버하면 string | undefined다.
const port = config.server?.getPort?.();       // 여기서 port를 호버하면 number | undefined다.
const hosts = config.server?.hosts;            // 여기서 hosts를 호버하면 string[] | undefined다.

console.log("firstHost:", firstHost);
console.log("port:", port);
console.log("hosts:", hosts);

const emptyConfig: Config = {};

function logAndReturnPort(): number {
  console.log("getPort() called"); // 이 줄이 찍히면 단락되지 않은 것이다.
  return 8080;
}

const emptyPort = emptyConfig.server?.hosts?.[logAndReturnPort()];
console.log("emptyPort:", emptyPort);

export {};
