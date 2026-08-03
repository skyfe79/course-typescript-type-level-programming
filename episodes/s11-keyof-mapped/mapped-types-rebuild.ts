interface UserProfile {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

// keyof로 얻은 키 집합을 다시 순회하면 원래 객체 타입의 모양을 그대로 재조립할 수 있다.
type ShapeCheck = { [K in keyof UserProfile]: UserProfile[K] };
// 호버: id, name, email, isAdmin 네 개가 그대로 펼쳐진다 — 루프가 키마다 한 번씩 돌았다는 증거다.

const profile: ShapeCheck = {
  id: "u-1",
  name: "Ada",
  email: "ada@example.com",
  isAdmin: false,
};

console.log("profile", profile);

// 같은 루프에 readonly를 붙이면 모든 프로퍼티가 읽기 전용으로 다시 만들어진다.
type FrozenProfile = { readonly [K in keyof UserProfile]: UserProfile[K] };

const frozen: FrozenProfile = { ...profile };
// 두 줄이 똑같이 찍힌다 — readonly는 타입 검사기 안에만 있고 런타임 객체에는 흔적이 없다.
console.log("frozen ", frozen);

// 매핑된 타입이 붙인 readonly는 나중의 재대입을 막는다.
// frozen.name = "Grace";
// error TS2540: Cannot assign to 'name' because it is a read-only property.

export {};
