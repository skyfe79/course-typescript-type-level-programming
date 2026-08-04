// DeepReadonly가 객체의 바깥 속성뿐 아니라 안쪽 속성까지 readonly로 바꾸는지 확인한다.
// 실행: node episodes/s21-conditional-types-infer/deep-readonly.ts
// 검사: npx tsc --noEmit

// T가 객체라면 keyof T로 속성 이름을 순회하고, 각 속성 값을 다시 DeepReadonly에 넣는다.
// 이 재귀는 매핑된 타입의 프로퍼티 값 자리에서 일어난다. 그래서 실제로 그 속성을 볼 때
// 필요한 만큼만 다음 단계 계산이 진행된다.
export type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

interface Config {
  server: {
    host: string;
    port: number;
  };
  flags: {
    debug: boolean;
  };
}

type ReadonlyConfig = DeepReadonly<Config>;

const config: ReadonlyConfig = {
  server: {
    host: "localhost",
    port: 3000,
  },
  flags: {
    debug: true,
  },
};

function tryToEditConfig(c: ReadonlyConfig): void {
  // 가장 안쪽 속성에도 readonly가 전파된다.
  // 이 줄은 TS2540, "Cannot assign to 'host' because it is a read-only property."를 확인한다.
  // 함수는 호출하지 않는다. Node의 타입 스트리핑은 타입 오류를 런타임 차단으로 바꾸지 않기 때문이다.
  // @ts-expect-error
  c.server.host = "127.0.0.1";

  // 바깥 속성 자체도 readonly가 되었으므로 새 객체로 갈아 끼울 수 없다.
  // @ts-expect-error
  c.server = {
    host: "example.com",
    port: 80,
  };
}

console.log(`DeepReadonly 읽기 확인: 서버는 ${config.server.host}:${config.server.port}입니다.`);
