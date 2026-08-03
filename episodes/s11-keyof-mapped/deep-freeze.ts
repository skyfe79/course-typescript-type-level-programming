// 중첩 객체까지 재귀적으로 얼리는 함수의 반환 타입을 Readonly<T>로 두면 무엇이 어긋나는지 확인한다.
// 재귀적 매핑된 타입 DeepReadonly<T>로 모든 깊이에 readonly를 적용해 그 어긋남을 없앤다.
// 마지막으로 타입 검사만 우회해 실행하면 런타임도 같은 자리에서 막는다는 것을 대조한다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s11-keyof-mapped/deep-freeze.ts

// codeStep 168 — 얕은 동결의 타입-런타임 어긋남 재현

interface AppSettings {
  theme: string;
  limits: { maxUsers: number; maxProjects: number };
}

function deepFreezeRuntime<T extends object>(obj: T): Readonly<T> {
  for (const value of Object.values(obj)) {
    if (value !== null && typeof value === "object") {
      deepFreezeRuntime(value);
    }
  }

  return Object.freeze(obj);
}

const rawSettings: AppSettings = {
  theme: "dark",
  limits: { maxUsers: 10, maxProjects: 3 },
};

const settings = deepFreezeRuntime(rawSettings);
console.log("얕은 계약 — limits까지 얼었나:", Object.isFrozen(settings.limits));

// 타입은 Readonly<T>다 — limits 자체만 readonly로 표시되고 그 안의 maxUsers는 쓰기 가능해 보인다.
// 그래서 아래 재대입은 컴파일에서 아무 오류도 내지 않는다. 막는 것은 런타임뿐이다.
try {
  settings.limits.maxUsers = 999;
} catch (error) {
  console.log("얕은 계약 — 런타임이 막는다:", (error as Error).message);
}

console.log("얕은 계약 — maxUsers 그대로:", settings.limits.maxUsers);

export {};
