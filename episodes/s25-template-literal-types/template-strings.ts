// 템플릿 리터럴 타입으로 문자열을 연결하고 그 결과를 런타임 값과 함께 확인한다.
// 실행: node episodes/s25-template-literal-types/template-strings.ts
// 검사: npx tsc --noEmit

// codeStep 351 — 템플릿 리터럴 타입으로 문자열 만들기

// 템플릿 리터럴 타입은 값에서 쓰는 템플릿 리터럴과 같은 문법으로 타입 공간의 문자열을 연결한다.
type Greeting<Name extends string> = `Hello, ${Name}!`;
type Hi = Greeting<"Ada">;

// 리터럴 문자열을 보간하면 타입 검사기가 각 조각을 합쳐 완성된 문자열 리터럴 타입을 계산한다.
type ApiRoute<Resource extends string> = `/api/${Resource}`;
type UsersRoute = ApiRoute<"users">;

// Eq는 두 타입이 정확히 같은지를 판별해 편집기의 호버 결과를 컴파일러 검사로도 고정한다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// Hi와 UsersRoute가 넓은 string이 아니라 예상한 완성 문자열 자체인지 확인한다.
const hiIsHelloAda: Eq<Hi, "Hello, Ada!"> = true;
const usersRouteIsApiUsers: Eq<UsersRoute, "/api/users"> = true;

// 런타임 함수의 반환 타입에도 같은 패턴을 적어 어떤 모양의 문자열이 돌아오는지 보존한다.
function greeting(name: string): `Hello, ${string}!` {
  return `Hello, ${name}!`;
}

function apiRoute(resource: string): `/api/${string}` {
  return `/api/${resource}`;
}

// 명령줄 인자가 없을 때는 world를 사용하고, 고정된 users 경로도 함께 출력한다.
const name = process.argv[2] ?? "world";
console.log(greeting(name));
console.log(apiRoute("users"));

// codeStep 352 — 유니온 보간과 결과 타입 확인하기

// 템플릿 리터럴 타입의 각 자리에 유니온을 넣으면 가능한 모든 조합의 유니온이 만들어진다.
type Method = "GET" | "POST" | "DELETE";
type Resource = "users" | "orders";

type Endpoint = `${Method} /${Resource}`;

// 여섯 멤버를 직접 적은 유니온과 비교해 빠지거나 더해진 조합 없이 정확히 계산되었는지 확인한다.
type ExpectedEndpoint =
  | "GET /users"
  | "GET /orders"
  | "POST /users"
  | "POST /orders"
  | "DELETE /users"
  | "DELETE /orders";

const endpointHasAllCombinations: Eq<Endpoint, ExpectedEndpoint> = true;

// @ts-expect-error - DELETE /orders가 빠진 다섯 멤버 유니온은 Endpoint와 같지 않다
const endpointNeedsEveryCombination: Eq<
  Endpoint,
  Exclude<ExpectedEndpoint, "DELETE /orders">
> = true;

// as const는 배열 원소를 string으로 넓히지 않고 각 문자열 리터럴의 유니온으로 보존한다.
const methods = ["GET", "POST", "DELETE"] as const;
const resources = ["users", "orders"] as const;

// 값 공간에서도 두 배열의 데카르트 곱을 만들어 타입 공간에서 계산한 여섯 조합과 나란히 확인한다.
// map 콜백의 템플릿 문자열 결과는 string으로 넓어지므로, 각 결과가 계산된 Endpoint임을 밝혀 준다.
const endpoints: Endpoint[] = methods.flatMap((m) =>
  resources.map((r) => `${m} /${r}` as Endpoint)
);

console.log(endpoints);

export {};
