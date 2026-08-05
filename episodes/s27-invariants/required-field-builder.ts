// 제공한 필수 키를 타입에 누적해, 완성된 사용자만 만들 수 있는 빌더를 단계별로 조립한다.
// 실행: node episodes/s27-invariants/required-field-builder.ts
// 검사: npx tsc --noEmit

// codeStep 397 — 필수 필드와 선택 필드로 빌더 뼈대 만들기

// 사용자를 식별하고 연락하려면 id와 email이 반드시 필요하다.
interface RequiredFields {
  id: string;
  email: string;
}

// nickname과 bio는 호출자가 원할 때만 빌더에 제공하는 선택 필드다.
interface OptionalFields {
  nickname: string;
  bio: string;
}

// set() 하나로 모든 필드를 다루기 위해 두 필드 집합을 합친다.
type AllFields = RequiredFields & OptionalFields;

class UserBuilder {
  // 빌드 도중에는 일부 값만 들어 있으므로 내부 저장소는 Partial이어야 한다.
  private fields: Partial<AllFields> = {};

  // 아직은 어떤 키를 받았는지 타입에 기록하지 않고 현재 빌더를 그대로 반환한다.
  set<K extends keyof AllFields>(key: K, value: AllFields[K]): this {
    this.fields[key] = value;
    return this;
  }

  // 현재 단계에는 완전성 제약이 없어 비어 있는 객체도 AllFields라고 단언할 수 있다.
  build(): AllFields {
    return this.fields as AllFields;
  }
}

// 이 호출은 397에서는 통과한다. 399에서 같은 호출이 거부되는지 비교하기 위해 실행하지 않는다.
function tryBuildWithoutAnyFields(): void {
  // Node의 타입 스트리핑은 타입 오류를 실행 중에 막지 않으므로, 이 함수는 정의만 하고 호출하지 않는다.
  new UserBuilder().build();
}

export {};
