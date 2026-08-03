// 지난 화들의 얼리기와 마찬가지로 as const는 각 값을 리터럴 타입으로 고정한다.
const appConfig = {
  server: { host: "localhost", port: 8080 },
  features: { darkMode: true, betaAccess: false },
} as const;

// 경로도 그냥 문자열 배열이 아니라 리터럴 튜플 상수로 이름 붙여 둔다.
// 그래야 다음 단계의 타입 인덱스 접근과 한 칸씩 대응시켜 읽을 수 있다.
const serverHostPath = ["server", "host"] as const;
const serverPortPath = ["server", "port"] as const;
const darkModePath = ["features", "darkMode"] as const;

console.log(appConfig);

type AppConfig = typeof appConfig;

// 대괄호를 두 번 이어 붙이는 것만으로 중첩된 값의 정확한 타입이 나온다.
type ServerHostType = AppConfig["server"]["host"]; // 표시 타입: "localhost"
type ServerPortType = AppConfig["server"]["port"]; // 표시 타입: 8080

function readAt<T, K1 extends keyof T, K2 extends keyof T[K1]>(
  obj: T,
  outerKey: K1,
  innerKey: K2
): T[K1][K2] {
  return obj[outerKey][innerKey];
}

// K2 extends keyof T[K1]은 바깥쪽 키로 좁혀진 타입 안에서 다시 안쪽 키를 제약한다.
const host = readAt(appConfig, "server", "host"); // 표시 타입: "localhost"
console.log(serverHostPath.join("."), host);

const checkHost: ServerHostType = host;
const checkPortType: ServerPortType = 8080;

// 그 타입이 정확히 "localhost" 하나라는 것은 어긋나는 대입을 막아 두면 컴파일러가 말해 준다.
// const wrongHost: ServerHostType = "127.0.0.1";
// error TS2322: Type '"127.0.0.1"' is not assignable to type '"localhost"'.

export {};
