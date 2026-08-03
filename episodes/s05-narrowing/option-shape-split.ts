type FileOptions = { filePath: string; encoding?: string };
type UrlOptions = { url: string; timeoutMs?: number };
type ReadOptions = FileOptions | UrlOptions;

const fromFile: ReadOptions = { filePath: "/tmp/data.json" };
const fromUrl: ReadOptions = { url: "https://example.com/data.json" };

function loadSource(options: ReadOptions): string {
  if ("filePath" in options) {
    // 여기서 options를 호버하면 FileOptions로 좁혀져 있다.
    return `reading file: ${options.filePath}`;
  } else {
    // 여기서 options를 호버하면 UrlOptions로 좁혀져 있다.
    return `fetching url: ${options.url}`;
  }
}

console.log(loadSource(fromFile));
console.log(loadSource(fromUrl));
