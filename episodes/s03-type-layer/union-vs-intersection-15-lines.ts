interface WithId {
  id: string;
}

interface WithName {
  name: string;
}

// 아래 함수의 주석을 해제하면, 공통 프로퍼티가 없어 컴파일 에러가 난다
// function showUnion(entity: WithId | WithName) {
//   console.log(entity.id);
// }
