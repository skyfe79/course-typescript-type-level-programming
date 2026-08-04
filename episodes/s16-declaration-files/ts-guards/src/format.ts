// 런타임 값인 formatMessage 함수를 내보내는 모듈입니다.
// guards.ts가 이 함수를 실제로 호출하므로, 그 임포트는 컴파일이 끝난 뒤에도 남아야 합니다.

export function formatMessage(label: string, detail: string): string {
  return `[${label}] ${detail}`;
}
