// ascii-banner 패키지에 붙이는 선언 파일입니다.
// 패키지가 타입을 함께 배포하지 않으므로 이 파일이 그 자리를 대신합니다.
//
// 최상위에 import·export가 없어야 이 파일이 앰비언트 선언으로 동작합니다.
// 파일 이름은 소스 파일과 겹치지 않게 둡니다 — banner-main.ts 옆에
// banner-main.d.ts를 두면 컴파일러가 그 선언 파일을 프로그램에서 제외합니다.

declare module "ascii-banner" {
  /**
   * 이 프로젝트가 실제로 부르는 함수만 선언합니다.
   * 패키지가 함께 내보내는 box·gradient는 여기서 쓰지 않으므로 옮기지 않습니다.
   * 옮기지 않은 이름을 가져오면 TS2305로 막히므로, 이 선언 파일이
   * 곧 "이 프로젝트가 이 패키지에서 쓰기로 한 범위"가 됩니다.
   */
  export function banner(
    text: string,
    options?: { width?: number },
  ): string;

  export function divider(char?: string, width?: number): string;
}
