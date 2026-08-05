// 필수 요청 필드가 채워진 상태를 타입 매개변수에 누적해, 올바른 호출 순서를 타입으로 표현한다.
// 실행: node episodes/s27-invariants/builder-completeness.ts
// 검사: npx tsc --noEmit

// codeStep 395 — 키 누적 타입 매개변수 만들기

// Eq는 두 타입이 정확히 같은지 판별해, 편집기 호버 없이도 누적된 키를 컴파일러에 고정한다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// 요청을 완성하려면 url과 method가 모두 제공되어야 한다.
type RequiredKeys = "url" | "method";

type RequestFields = {
  url: string;
  method: string;
};

// Provided는 지금까지 호출된 setter의 키를 유니온으로 기억한다.
class RequestBuilder<Provided extends RequiredKeys = never> {
  // setter 호출 전에는 일부 필드가 비어 있으므로 내부 저장소만 Partial로 둔다.
  private fields: Partial<RequestFields> = {};

  // 반환 타입에 "url"을 더해, 이 호출로 url이 제공되었다는 사실을 다음 체인에 전달한다.
  setUrl(url: string): RequestBuilder<Provided | "url"> {
    this.fields.url = url;
    return this as RequestBuilder<Provided | "url">;
  }

  // 반환 타입에 "method"를 더해, 기존 키를 잃지 않고 새 키를 누적한다.
  setMethod(method: string): RequestBuilder<Provided | "method"> {
    this.fields.method = method;
    return this as RequestBuilder<Provided | "method">;
  }

  // codeStep 396 — 필드 누락 시 build() 컴파일 에러 확인하기

  // build의 this 타입은 RequiredKeys에서 Provided를 뺀 결과가 never일 때만 현재 인스턴스를 허용한다.
  // 즉, 남은 필수 키가 하나라도 있으면 호출 대상의 타입이 never가 되어 컴파일 단계에서 막힌다.
  build(
    this: Exclude<RequiredKeys, Provided> extends never ? this : never,
  ): RequestFields {
    // 이 구현은 두 필드가 모두 있다는 타입 제약을 통과한 호출에서만 실행할 수 있다.
    // 내부 저장소는 Partial이므로, 완성된 공개 결과 타입으로 좁혀 반환한다.
    return this.fields as RequestFields;
  }
}

const withUrl = new RequestBuilder().setUrl("/users");
const urlKeyIsAccumulated: Eq<typeof withUrl, RequestBuilder<"url">> = true;

const withUrlAndMethod = withUrl.setMethod("GET");
const bothKeysAreAccumulated: Eq<
  typeof withUrlAndMethod,
  RequestBuilder<"url" | "method">
> = true;

// codeStep 396 (이어서) — 두 호출을 나란히 두고 앞의 것만 막히는지 확인하기

// method를 빠뜨린 호출과 두 setter를 모두 거친 호출 중 앞의 것만 타입 오류가 된다.
function tryBuildWithoutMethod(): void {
  // Node의 타입 스트리핑은 타입 오류를 실행 중에 막지 않으므로, 이 함수는 정의만 하고 호출하지 않는다.
  // @ts-expect-error - method가 아직 제공되지 않아 남은 필수 키가 존재한다
  new RequestBuilder().setUrl("/users").build();
  // 실측 진단(@ts-expect-error 한 줄만 제거했을 때):
  // episodes/s27-invariants/builder-completeness.ts(62,3): error TS2684: The 'this' context of type 'RequestBuilder<"url">' is not assignable to method's 'this' of type 'never'.
}

// 두 키가 모두 누적되면 남은 필수 키가 never가 되어 정상적으로 요청 객체를 만들 수 있다.
const request = new RequestBuilder().setUrl("/users").setMethod("GET").build();
const buildReturnsCompleteRequest: Eq<typeof request, RequestFields> = true;

console.log("완성된 요청:", request);

export {};
