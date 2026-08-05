// 라우트 경로를 세그먼트로 나누고 콜론으로 표시한 파라미터를 객체 타입으로 파싱한다.
// 실행: node episodes/s25-template-literal-types/route-params.ts
// 검사: npx tsc --noEmit

// codeStep 364 — 경로를 세그먼트 단위로 토큰화하기

// 문자열에서 Delim을 찾아 그 앞부분은 Token으로, 뒷부분은 Rest로 분해한다.
// 첫 번째 infer 자리는 탐욕적으로 추론하지 않으므로 Token은 가장 앞에 나오는 구분자까지만 차지한다.
// Rest를 다시 Split에 넣어 남은 문자열도 같은 구분자로 계속 나눈다.
type Split<S extends string, Delim extends string> =
  S extends `${infer Token}${Delim}${infer Rest}`
    ? [Token, ...Split<Rest, Delim>]
    : [S];

// 슬래시로 시작하는 경로를 그대로 Split하면 첫 슬래시 앞부분이 빈 문자열 세그먼트가 된다.
// PathSegments는 맨 앞 슬래시를 먼저 벗겨 낸 뒤 나머지를 나누어 실제 경로 조각만 남긴다.
// 슬래시로 시작하지 않는 경로도 같은 타입으로 다룰 수 있도록 다른 경우에는 S를 그대로 나눈다.
type PathSegments<S extends string> = S extends `/${infer Rest}`
  ? Split<Rest, "/">
  : Split<S, "/">;

const route = "/users/:id/posts/:postId";
type Segments = PathSegments<typeof route>;

// 런타임에서도 빈 조각을 제거해 타입 수준의 PathSegments와 같은 세그먼트를 만든다.
console.log(route.split("/").filter(Boolean));

// Eq는 두 타입이 정확히 같은지를 판별해 호버로 확인하던 결과를 컴파일러 검사로 고정하는 장치다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

const segmentsMatch: Eq<Segments, ["users", ":id", "posts", ":postId"]> = true;

// codeStep 365 — `:id` 같은 파라미터 세그먼트를 객체 키로 모으기

// ParamNames는 세그먼트 튜플을 Head와 Rest로 나누어 머리부터 꼬리까지 걷는 재귀 타입이다.
// Head가 콜론으로 시작하면 콜론 뒤의 Name을 추출해 나머지 결과와 유니온으로 합친다.
// 콜론이 붙지 않은 일반 세그먼트는 유니온에 아무것도 더하지 않고 Rest로 그냥 지나간다.
type ParamNames<Segs extends readonly string[]> =
  Segs extends readonly [infer Head extends string, ...infer Rest extends readonly string[]]
    ? Head extends `:${infer Name}`
      ? Name | ParamNames<Rest>
      : ParamNames<Rest>
    : never;

// 더 걸을 세그먼트가 없을 때 never를 반환하는 이유는 유니온에서 never가 아무것도 더하지 않는 항등원이기 때문이다.
// ParseParams는 추출한 이름 유니온을 키로 순회하는 매핑된 타입이며 각 파라미터 값은 string으로 정한다.
// 파라미터가 없으면 키 유니온이 never가 되므로 매핑할 프로퍼티가 없어 결과는 빈 객체 타입 {}가 된다.
type ParseParams<S extends string> = {
  [K in ParamNames<PathSegments<S>>]: string;
};

type Params = ParseParams<typeof route>;

const paramsMatch: Eq<Params, { id: string; postId: string }> = true;

// codeStep 366 — 여러 경로로 ParseParams 검증하기

// 파라미터가 없는 경로, 하나인 경로, 세 개인 경로를 나란히 두고 재귀가 각 모양을 만드는지 확인한다.
type NoParams = ParseParams<"/health">;
type OneParam = ParseParams<"/users/:id">;
type ThreeParams = ParseParams<"/a/:x/b/:y/c/:z">;

const noParamsMatch: Eq<NoParams, {}> = true;
const threeParamsMatch: Eq<ThreeParams, { x: string; y: string; z: string }> = true;

const oneParam: OneParam = { id: "42" };

// @ts-expect-error - OneParam에는 postId라는 키가 없어, 이 자리에 넣으면 초과 속성 오류가 난다.
const rejected: OneParam = { id: "42", postId: "7" };

// 타입 검사는 실행 후 사라지지만, 올바른 모양으로 만든 값은 런타임에서도 그대로 사용할 수 있다.
console.log(oneParam);

export {};
