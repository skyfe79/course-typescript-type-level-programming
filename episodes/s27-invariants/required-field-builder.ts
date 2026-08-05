// 제공한 필수 키를 타입에 누적해, 완성된 사용자만 만들 수 있는 빌더를 단계별로 조립한다.
// 실행: node episodes/s27-invariants/required-field-builder.ts
// 검사: npx tsc --noEmit

// codeStep 397 — 필수 필드와 선택 필드로 빌더 뼈대 만들기

// 사용자를 식별하고 연락하려면 id와 email이 반드시 필요하다.
interface RequiredFields {
  id: string;
  email: string;
}

// nickname과 bio는 호출자가 원할 때만 빌더에 제공하는 선택 필드다.
interface OptionalFields {
  nickname: string;
  bio: string;
}

// set() 하나로 모든 필드를 다루기 위해 두 필드 집합을 합친다.
type AllFields = RequiredFields & OptionalFields;

// codeStep 398 — 제공한 키를 누적하는 타입 매개변수 연결하기

// Eq는 두 타입이 정확히 같은지 판별해, 누적 결과를 컴파일러가 계속 검사하게 한다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// Provided는 지금까지 set()으로 제공된 필수 키만 유니온으로 기억한다.
class UserBuilder<Provided extends keyof RequiredFields = never> {
  // 빌드 도중에는 일부 값만 들어 있으므로 내부 저장소는 Partial이어야 한다.
  private fields: Partial<AllFields> = {};

  // K가 필수 키일 때만 Provided에 더한다. 선택 키는 빌드 가능 여부를 바꾸지 않는다.
  set<K extends keyof AllFields>(
    key: K,
    value: AllFields[K],
  ): UserBuilder<K extends keyof RequiredFields ? Provided | K : Provided> {
    this.fields[key] = value;
    // 같은 인스턴스를 돌려준다. build의 this 타입도 상태마다 달라지므로 unknown을 거쳐 상태만 갱신한다.
    return this as unknown as UserBuilder<K extends keyof RequiredFields ? Provided | K : Provided>;
  }

  // codeStep 399 — 누락된 필드로 build() 호출해 컴파일 에러 확인하기

  // RequiredFields에서 Provided를 뺀 키가 없을 때만 이 빌더를 호출 대상으로 허용한다.
  build(
    this: Exclude<keyof RequiredFields, Provided> extends never
      ? UserBuilder<Provided>
      : never,
  ): AllFields {
    // 공개 API가 모든 필수 키를 확인했으므로 완성된 결과 타입으로 좁혀 반환한다.
    return this.fields as AllFields;
  }
}

// 이 호출은 397에서는 통과한다. 399에서 같은 호출이 거부되는지 비교하기 위해 실행하지 않는다.
function tryBuildWithoutAnyFields(): void {
  // Node의 타입 스트리핑은 타입 오류를 실행 중에 막지 않으므로, 이 함수는 정의만 하고 호출하지 않는다.
  // @ts-expect-error - id와 email이 모두 제공되지 않아 남은 필수 키가 존재한다
  new UserBuilder().build();
  // 실측 진단(@ts-expect-error 한 줄만 제거했을 때):
  // episodes/s27-invariants/required-field-builder.ts(58,3): error TS2684: The 'this' context of type 'UserBuilder<never>' is not assignable to method's 'this' of type 'never'.
}

const withId = new UserBuilder().set("id", "user-1");
const idIsAccumulated: Eq<typeof withId, UserBuilder<"id">> = true;

const withIdAndNickname = withId.set("nickname", "타입 탐험가");
const optionalKeyDoesNotAccumulate: Eq<
  typeof withIdAndNickname,
  UserBuilder<"id">
> = true;

// id만 제공한 호출도 email이 남아 있으므로 컴파일 단계에서 거부된다.
function tryBuildWithOnlyId(): void {
  // 이 함수 역시 실행하지 않아, 오류 예제가 런타임 결과를 만들지 않게 한다.
  // @ts-expect-error - email이 아직 제공되지 않아 남은 필수 키가 존재한다
  withId.build();
  // 실측 진단(@ts-expect-error 한 줄만 제거했을 때):
  // episodes/s27-invariants/required-field-builder.ts(76,3): error TS2684: The 'this' context of type 'UserBuilder<"id">' is not assignable to method's 'this' of type 'never'.
}

// 필수 키를 모두 제공하면 선택 키의 개수와 관계없이 build()를 호출할 수 있다.
const complete = new UserBuilder()
  .set("id", "user-1")
  .set("email", "learner@example.com")
  .set("nickname", "타입 탐험가")
  .build();
const buildReturnsCompleteUser: Eq<typeof complete, AllFields> = true;

console.log("완성된 사용자:", complete);

export {};
