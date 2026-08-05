// 임의의 스키마와 메서드 호출 체인에 통하는 타입 안전 쿼리 빌더의 뼈대를 세운다.
// 실행: node projects/dbq/dbq.ts
// 검사: npx tsc --noEmit

// codeStep 369 — 스키마 타입 정의하기

// Eq는 두 타입이 정확히 같은지를 판별해, 호버로 확인하던 결과를 컴파일러 검사로 고정하는 장치다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// 객체 타입 하나에 테이블의 컬럼 이름과 각 컬럼에 들어갈 값의 타입을 함께 기록한다.
type UsersSchema = {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
};

// keyof UsersSchema는 스키마에 적힌 키를 "id" | "name" | "email" | "isActive"라는
// 컬럼 이름 유니온으로 그대로 꺼내 준다.
type ColumnName = keyof UsersSchema;

// 호버를 열지 않아도 컬럼 이름 유니온이 의도한 결과인지 타입 검사에서 계속 확인할 수 있다.
const columnNamesMatch: Eq<ColumnName, "id" | "name" | "email" | "isActive"> = true;

// codeStep 370 — 빌더의 타입 매개변수 뼈대 만들기

// Schema는 사용할 테이블의 모양을, Selected는 지금까지 고른 컬럼의 합집합을 기억한다.
// 아직 아무 컬럼도 고르지 않은 상태는 합집합의 항등원인 never로 시작한다.
class QueryBuilder<Schema, Selected extends keyof Schema = never> {
  // select는 값을 계산하는 메서드가 아니라, 새 컬럼을 타입 매개변수에 합쳐
  // Selected | Cols를 기억하는 새 QueryBuilder 타입을 돌려주는 메서드다.
  select<Cols extends keyof Schema>(...cols: Cols[]): QueryBuilder<Schema, Selected | Cols> {
    // 이번 화에서는 타입 매개변수가 이어지는 구조만 세우므로 런타임 객체는 그대로 돌려준다.
    // this as unknown as ...는 다음 화에서 실제 행 타입 좁히기를 구현하기 전까지 쓰는 자리표시자다.
    return this as unknown as QueryBuilder<Schema, Selected | Cols>;
  }
}

const qb = new QueryBuilder<UsersSchema>();
const afterId = qb.select("id");
const afterName = afterId.select("name");

// Eq 단언으로 호출할 때마다 Selected에 컬럼이 누적된다는 사실을 타입 게이트에 고정한다.
const afterIdMatch: Eq<typeof afterId, QueryBuilder<UsersSchema, "id">> = true;
const afterNameMatch: Eq<typeof afterName, QueryBuilder<UsersSchema, "id" | "name">> = true;

// true가 출력된다. 런타임 객체는 하나인 채 그대로이고, 호출을 거치며 달라진 것은 타입뿐이다.
console.log(afterName === qb);

// @ts-expect-error - 스키마에 없는 컬럼 이름은 select에 넘길 수 없다.
qb.select("nope");

export {};
