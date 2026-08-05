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

export {};
