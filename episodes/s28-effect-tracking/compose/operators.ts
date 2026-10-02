import { Program } from "./program.ts";
import type { EffectTag } from "./program.ts";

// 순차 오퍼레이터는 앞 결과를 다음 입력으로 넘기고, 오류와 이펙트를 합친다.
// NoInfer는 다음 프로그램 때문에 앞 결과 타입이 넓어지는 것을 막는다.
export function pipe<
  A, B, C, E1, E2, F1 extends EffectTag, F2 extends EffectTag,
>(
  first: Program<A, B, E1, F1>,
  second: Program<NoInfer<B>, C, E2, F2>,
): Program<A, C, E1 | E2, F1 | F2>;
export function pipe<
  A, B, C, D, E1, E2, E3,
  F1 extends EffectTag, F2 extends EffectTag, F3 extends EffectTag,
>(
  first: Program<A, B, E1, F1>,
  second: Program<NoInfer<B>, C, E2, F2>,
  third: Program<NoInfer<C>, D, E3, F3>,
): Program<A, D, E1 | E2 | E3, F1 | F2 | F3>;
export function pipe<
  A, B, C, D, O, E1, E2, E3, E4,
  F1 extends EffectTag, F2 extends EffectTag,
  F3 extends EffectTag, F4 extends EffectTag,
>(
  first: Program<A, B, E1, F1>,
  second: Program<NoInfer<B>, C, E2, F2>,
  third: Program<NoInfer<C>, D, E3, F3>,
  fourth: Program<NoInfer<D>, O, E4, F4>,
): Program<A, O, E1 | E2 | E3 | E4, F1 | F2 | F3 | F4>;

// 오버로드가 연결을 검사한다. 구현에서는 중간 타입을 지우고 순서대로 실행한다.
export function pipe(
  ...parts: Program<never, unknown, unknown, EffectTag>[]
): Program<never, unknown, unknown, EffectTag> {
  return Program.create(async (input, fx) => {
    let value: unknown = input;
    for (const part of parts) {
      value = await part.execute(value as never, fx);
    }
    return value;
  });
}

// 선택 오퍼레이터는 타입 가드로 입력을 좁히고 양쪽의 오류와 이펙트를 기록한다.
export function branch<
  In, T extends In, O1, O2, E1, E2,
  F1 extends EffectTag, F2 extends EffectTag,
>(
  test: (input: In) => input is T,
  onTrue: Program<NoInfer<T>, O1, E1, F1>,
  onFalse: Program<NoInfer<Exclude<In, T>>, O2, E2, F2>,
): Program<In, O1 | O2, E1 | E2, F1 | F2> {
  return Program.create(async (input, fx) => {
    if (test(input)) return onTrue.execute(input, fx);
    return onFalse.execute(input as Exclude<In, T>, fx);
  });
}

// 반복 오퍼레이터는 입력을 받고 종료 여부를 검사한 뒤 본문을 실행한다.
// 오류와 이펙트는 head와 body에서 전파된다. 처리한 오류는 정상적으로 회차를 마친다.
export function repeat<
  H, S extends H, EH, EB, FH extends EffectTag, FB extends EffectTag,
>(
  head: Program<void, H, EH, FH>,
  stop: (value: NoInfer<H>) => value is S,
  body: Program<NoInfer<Exclude<H, S>>, unknown, EB, FB>,
): Program<void, void, EH | EB, FH | FB> {
  return Program.create(async (_, fx) => {
    while (true) {
      const value = await head.execute(undefined, fx);
      if (stop(value)) return;
      await body.execute(value as Exclude<H, S>, fx);
    }
  });
}

// handle은 Exclude로 이펙트를, catchError는 Exclude로 선택한 오류를 제거한다.
// 핸들러의 결과와 기존 결과를 합친다. 가드가 거부한 예외는 바깥으로 전파한다.
export function catchError<In, Out, Err, Caught extends Err, R, Fx extends EffectTag>(
  program: Program<In, Out, Err, Fx>,
  guard: (error: NoInfer<Err>) => error is Caught,
  handler: (error: Caught) => Promise<R>,
): Program<In, Out | R, Exclude<Err, Caught>, Fx> {
  return Program.create(async (input, fx) => {
    try {
      return await program.execute(input, fx);
    } catch (error) {
      // 예외의 타입은 unknown이다. 실제 클래스 판별은 전달한 가드가 맡는다.
      const candidate = error as Err;
      if (!guard(candidate)) throw error;
      return handler(candidate);
    }
  });
}
