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

export {};
