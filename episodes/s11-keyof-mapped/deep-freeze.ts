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

// codeStep 169 — 재귀적 매핑된 타입 DeepReadonly<T> 작성

// 객체면 키마다 한 단계 더 들어가고, 원시값에 닿으면 재귀를 멈춘다.
type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

function deepFreeze<T extends object>(obj: T): DeepReadonly<T> {
  for (const value of Object.values(obj)) {
    if (value !== null && typeof value === "object") {
      deepFreeze(value);
    }
  }

  return Object.freeze(obj) as DeepReadonly<T>;
}

const frozenSettings = deepFreeze({
  theme: "dark",
  limits: { maxUsers: 10, maxProjects: 3 },
});

console.log("깊은 계약 — limits까지 얼었나:", Object.isFrozen(frozenSettings.limits));

// 같은 재대입인데, 이제는 실행하기 전에 컴파일이 막는다.
// (컴파일 실패 사례 — 주석 처리 + 진단 원문)
// frozenSettings.limits.maxUsers = 999;
// error TS2540: Cannot assign to 'maxUsers' because it is a read-only property.

// codeStep 170 — 3단계 중첩에서 타입과 런타임이 같은 자리에서 막히는지 확인

const config = deepFreeze({
  service: "checkout",
  network: { retries: 3, backoff: { baseMs: 100, factor: 2 } },
});

console.log("3단계 중첩 — backoff까지 얼었나:", Object.isFrozen(config.network.backoff));

// 가장 깊은 backoff.factor까지 readonly라 재대입이 컴파일 단계에서 막힌다.
// (컴파일 실패 사례 — 주석 처리 + 진단 원문)
// config.network.backoff.factor = 3;
// error TS2540: Cannot assign to 'factor' because it is a read-only property.

// 아래 단언은 타입 검사만 벗겨 낼 뿐, 런타임의 동결 상태는 그대로다.
// readonly를 푸는 방법이 아니라, 컴파일이 막은 자리를 실행해 보기 위한 우회다.
try {
  (config.network.backoff as { factor: number }).factor = 3;
} catch (error) {
  console.log("3단계 중첩 — 런타임도 같은 자리에서 막는다:", (error as Error).message);
}

console.log("3단계 중첩 — factor 그대로:", config.network.backoff.factor);

export {};
