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

export {};
