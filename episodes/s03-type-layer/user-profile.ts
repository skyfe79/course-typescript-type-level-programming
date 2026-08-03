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
