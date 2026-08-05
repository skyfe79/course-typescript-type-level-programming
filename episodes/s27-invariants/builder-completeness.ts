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
}

const withUrl = new RequestBuilder().setUrl("/users");
const urlKeyIsAccumulated: Eq<typeof withUrl, RequestBuilder<"url">> = true;

const withUrlAndMethod = withUrl.setMethod("GET");
const bothKeysAreAccumulated: Eq<
  typeof withUrlAndMethod,
  RequestBuilder<"url" | "method">
> = true;

export {};
