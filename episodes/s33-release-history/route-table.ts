// STEP 503 — 튜플과 문자열 타입으로 만든 HTTP 라우트 테이블을 satisfies로 안전하게 검사하기

// 저장소 전체를 검사할 때 다른 에피소드의 같은 이름 선언과 합쳐지지 않도록
// 이 파일만의 모듈 스코프를 만듭니다. 아래 예제의 실행 결과에는 영향을 주지 않습니다.
export {};

// 화별 파일은 다른 화를 가져오지 않고도 혼자 읽고 실행할 수 있어야 합니다.
// 따라서 앞선 화와 비슷한 이름이 있더라도 이 라우트 예제에 필요한 타입을 여기서 다시 선언합니다.
type HttpMethod = "get" | "post" | "delete";
type Resource = "users" | "orders";

// TypeScript 4.1의 템플릿 리터럴 타입은 문자열 리터럴 유니온을 타입 레벨에서 조합합니다.
// RouteKey는 두 유니온의 모든 조합인 "get /users" | "get /orders" | ...가 됩니다.
type RouteKey = `${HttpMethod} /${Resource}`;

// TypeScript 4.0의 가변 인자 튜플 타입은 고정 위치와 rest 위치를 한 튜플에 함께 표현합니다.
// method와 path에는 4.0의 레이블 있는 튜플 원소로 뜻을 붙이고, Params의 길이와 타입은 그대로 둡니다.
type RequestLine<Params extends unknown[]> = [
  method: HttpMethod,
  path: string,
  ...params: Params,
];

// request 앞에 요청 ID 하나를 덧붙여도 Params가 number, boolean 등 어떤 튜플인지 잃지 않습니다.
function withRequestId<Params extends unknown[]>(
  requestId: string,
  ...request: RequestLine<Params>
): [requestId: string, ...request: RequestLine<Params>] {
  return [requestId, ...request];
}

const tracedRequest = withRequestId("req-503", "get", "/users", 42, true);
// 4.0의 가변 인자 튜플 추론 덕분에 뒤의 number와 boolean까지 정확한 위치에 보존됩니다.
const typedRequest: [string, HttpMethod, string, number, boolean] = tracedRequest;

// TypeScript 4.1은 매핑된 타입의 `as` 자리에서 프로퍼티 이름 자체를 바꿀 수 있게 했습니다.
// 각 RouteKey를 handleGetUsers, handlePostOrders 같은 실행 가능한 핸들러 이름으로 리매핑합니다.
type RouteHandlers = {
  [Key in RouteKey as Key extends `${infer Method} /${infer ResourceName}`
    ? `handle${Capitalize<Method>}${Capitalize<ResourceName>}`
    : never]: (request: RequestLine<unknown[]>) => number;
};

const handlers: RouteHandlers = {
  handleGetUsers: () => 200,
  handleGetOrders: () => 200,
  handlePostUsers: () => 201,
  handlePostOrders: () => 201,
  handleDeleteUsers: () => 204,
  handleDeleteOrders: () => 204,
};

// TypeScript 3.4의 as const만 쓰면 값은 좁은 리터럴 타입과 readonly 프로퍼티로 고정됩니다.
// 그러나 이 표현만으로는 객체가 우리가 원하는 Record<RouteKey, number>와 맞는지 검사하지 않습니다.
const routesAsConstOnly = {
  "get /users": 200,
  "get /orders": 200,
  "post /users": 201,
  "post /orders": 201,
  "delete /users": 204,
  "delete /orders": 204,
} as const;
const asConstStatus: 200 = routesAsConstOnly["get /users"];

// 실제로 as const는 오타 키나 문자열 상태 코드도 그대로 받아들입니다.
// 원하는 라우트 테이블 타입을 적지 않았으므로 이 잘못된 프로퍼티 자체는 컴파일 오류가 아닙니다.
const uncheckedByAsConst = {
  ...routesAsConstOnly,
  "gett /users": "OK",
} as const;

// 반대로 타입 어노테이션은 키와 값을 검사하지만, 각 숫자 리터럴을 number로 넓힙니다.
const routesAnnotated: Record<RouteKey, number> = {
  "get /users": 200,
  "get /orders": 200,
  "post /users": 201,
  "post /orders": 201,
  "delete /users": 204,
  "delete /orders": 204,
};
const widenedStatus: number = routesAnnotated["get /users"];
// const lostLiteralStatus: 200 = routesAnnotated["get /users"]; // ← TS2322: Type 'number' is not assignable to type '200'.

// TypeScript 4.9의 satisfies는 두 방식 사이의 빈틈을 메웁니다.
// as const로 좁은 숫자 리터럴을 고정하고 satisfies로 Record<RouteKey, number> 적합성까지 검사합니다.
const routes = {
  "get /users": 200,
  "get /orders": 200,
  "post /users": 201,
  "post /orders": 201,
  "delete /users": 204,
  "delete /orders": 204,
} as const satisfies Record<RouteKey, number>;

const okStatus: 200 = routes["get /users"];
// const routesWithTypo = { ...routes, "gett /users": 200 } satisfies Record<RouteKey, number>; // ← TS2353: Object literal may only specify known properties, and '"gett /users"' does not exist in type 'Record<...>' (실제 메시지는 RouteKey 여섯 개를 모두 펼쳐서 보여 줍니다).
// const routesWithWrongValue = { ...routes, "get /users": "OK" } satisfies Record<RouteKey, number>; // ← TS2322: Type 'string' is not assignable to type 'number'.

// 서로 겹치는 값이 없는 타입끼리의 비교는 4.9 이전부터 TS2367로 잡힙니다.
const selectedMethod: HttpMethod = "get";
// if (selectedMethod === "patch") {} // ← TS2367: This comparison appears to be unintentional because the types '"get"' and '"patch"' have no overlap.

// 필요한 문자열을 유니온에 포함한 뒤 비교하는 것이 실제로 동작하는 대안입니다.
type ExtendedHttpMethod = HttpMethod | "patch";
const incomingMethod: ExtendedHttpMethod = "patch";
const isPatchRequest = incomingMethod === "patch";

interface RouteOptions {
  timeoutMs?: number;
}

// TypeScript 4.4의 exactOptionalPropertyTypes는 strict에 포함되지 않은 별도 opt-in 플래그입니다.
// 루트 설정에서는 꺼져 있으므로 undefined 명시 대입이 통과하지만, 아래 전용 설정에서는 TS2375가 납니다.
// npx tsc --noEmit -p episodes/s33-release-history/tsconfig.exact-optional.json
const routeOptions: RouteOptions = { timeoutMs: undefined }; // ← TS2375: exactOptionalPropertyTypes를 켜면 undefined를 number에 대입할 수 없습니다.

function main() {
  console.log(`route key: get /users -> ${okStatus}`);
  console.log(`remapped handler: handlePostOrders -> ${handlers.handlePostOrders(["post", "/orders"])}`);
  console.log(`variadic tuple: ${typedRequest.join(" | ")}`);
  console.log(`as const only: ${asConstStatus}, unchecked key -> ${uncheckedByAsConst["gett /users"]}`);
  console.log(`annotation widens literal: ${widenedStatus}`);
  console.log(`satisfies keeps literal: ${okStatus}`);
  console.log(`overlap-safe comparison: ${incomingMethod} is patch -> ${isPatchRequest}`);
  console.log(`optional timeout: ${String(routeOptions.timeoutMs)}`);

  // TypeScript 4.4의 useUnknownInCatchVariables는 strict 모드의 catch 변수를 any 대신 unknown으로 둡니다.
  try {
    throw new Error("route not found");
  } catch (error) {
    // console.log(error.message); // ← TS18046: 'error' is of type 'unknown'.
    const message = error instanceof Error ? error.message : String(error);
    console.log(`caught safely: ${message}`);
  }
}

main();
