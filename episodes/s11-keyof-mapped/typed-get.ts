// 키 이름 세 개를 가진 평범한 객체 하나로 시작한다.
const user = {
  id: 1,
  name: "Ada",
  email: "ada@example.com",
};

// key를 그냥 string으로 받으면, 타입 검사기는 그 문자열이 실제 프로퍼티 이름인지 알 수 없다.
function getLoose(obj: any, key: string) {
  return obj[key];
}

const typo = getLoose(user, "nam");
console.log(typo);
// undefined — 오타인데도 컴파일은 그대로 통과한다.

// 객체 타입에서 가능한 키 이름만 K로 받으면, 호출하는 쪽의 문자열도 검사 대상이 된다.
function get<T extends object, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}

const okName = get(user, "name");
const okEmail = get(user, "email");
console.log(okName, okEmail);

// 반환 타입을 적지 않았는데도, 검사기는 key에 맞는 값의 타입을 따로 돌려준다.
const checkName: string = get(user, "name");
const checkId: number = get(user, "id");

// user에 없는 키는 key 매개변수 자리에 들어갈 수 없다. 그래서 아래 줄은 막아 두었다.
// const typoRejected = get(user, "nam");
// error TS2345: Argument of type '"nam"' is not assignable to parameter of type '"email" | "id" | "name"'.

export {};
