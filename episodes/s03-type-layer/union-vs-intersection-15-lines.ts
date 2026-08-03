interface WithId { id: string }
interface WithName { name: string }

// 유니온 — 좁힘: 두 타입에 공통인 프로퍼티만 접근할 수 있다
// 아래 함수의 주석을 해제하면, 공통 프로퍼티가 없어 컴파일 에러가 난다
// function showUnion(entity: WithId | WithName) {
//   console.log(entity.id);
// }

// 인터섹션 — 넓힘: 두 타입의 프로퍼티에 모두 접근할 수 있다
function showIntersection(entity: WithId & WithName) {
  console.log(entity.id, entity.name);
}

showIntersection({ id: "u1", name: "Ada" });
