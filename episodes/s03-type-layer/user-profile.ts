interface UserProfile {
  name: string;
}

interface UserProfile {
  age: number;
}

const u: UserProfile = { name: "Ada", age: 30 };
console.log(u);

// 아래 줄의 주석을 해제하면 age가 없어 에러가 난다
// const incompleteUser: UserProfile = { name: "Ada" };

// 아래 선언의 주석을 해제하면 interface UserProfile과 이름이 충돌해 에러가 난다
// type UserProfile = {
//   age: number;
// };
