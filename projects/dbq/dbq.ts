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

export {};
