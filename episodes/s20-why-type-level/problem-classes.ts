// 타입 레벨 코드가 푸는 세 가지 문제를 한 파일에서 차례로 확인한다.
// 실행: node episodes/s20-why-type-level/problem-classes.ts
// 검사: npx tsc --noEmit

type ReadonlyShape<T> = { readonly [K in keyof T]: T[K] };

interface Draft {
  title: string;
  body: string;
}

const doc: ReadonlyShape<Draft> = { title: "제목", body: "본문" };

// 매핑된 타입이 모든 프로퍼티에 readonly를 붙였으므로 재대입이 막힌다.
// (컴파일 실패 사례 — 주석 처리 + 진단 원문)
// doc.title = "다른 제목";
// error TS2540: Cannot assign to 'title' because it is a read-only property.

function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// `K`가 `keyof T`로 제약돼 있어 객체에 없는 키는 인자 자리에서 걸린다.
// (컴파일 실패 사례 — 주석 처리 + 진단 원문)
// pluck(doc, "missing");
// error TS2345: Argument of type '"missing"' is not assignable to parameter of type 'keyof Draft'.

function openFile() {
  return {
    write(data: string) {
      console.log("씀:", data);
      return {
        close() {
          console.log("닫음");
        },
      };
    },
  };
}

// `close`는 `write`가 반환한 객체에만 있으므로, 순서를 건너뛰면 그 이름이 아예 존재하지 않는다.
// (컴파일 실패 사례 — 주석 처리 + 진단 원문)
// openFile().close();
// error TS2339: Property 'close' does not exist on type '{ write(data: string): { close(): void; }; }'.

console.log(doc);
console.log(pluck(doc, "title"));
openFile().write("hello").close();

export {};
