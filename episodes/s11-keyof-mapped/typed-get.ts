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

export {};
