// name의 리터럴 타입으로 세 오류를 구별해 Exclude가 선택한 오류만 제거한다.
// HTTP 실패는 서버의 상태 코드와 요청 주소를 보존하는 오류이다.
export class HttpError extends Error {
  override readonly name = "HttpError";
  readonly status: number;
  readonly url: string;

  constructor(status: number, url: string) {
    const address = new URL(url);
    const size = address.pathname.split("/")[1];
    super(`${address.hostname} ${status}: ${size}`);
    this.status = status;
    this.url = url;
  }
}

// 요청 자체가 실패하면 주소와 원인을 함께 보존한다.
export class NetworkError extends Error {
  override readonly name = "NetworkError";
  readonly url: string;

  constructor(url: string, cause: unknown) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    super(`네트워크 요청 실패: ${url} (${detail})`, { cause });
    this.url = url;
  }
}

// 디렉터리 생성이나 파일 쓰기가 실패하면 경로와 원인을 함께 보존한다.
export class WriteError extends Error {
  override readonly name = "WriteError";
  readonly path: string;

  constructor(path: string, cause: unknown) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    super(`파일 저장 실패: ${path} (${detail})`, { cause });
    this.path = path;
  }
}

// HTTP 실패는 한 회차에서 처리하고, 나머지 두 오류는 앱을 중단할 때 처리한다.
export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

export function isFatal(error: unknown): error is NetworkError | WriteError {
  return error instanceof NetworkError || error instanceof WriteError;
}
