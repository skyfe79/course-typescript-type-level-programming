type FileOptions = { filePath: string; encoding?: string };
type UrlOptions = { url: string; timeoutMs?: number };
type ReadOptions = FileOptions | UrlOptions;

const fromFile: ReadOptions = { filePath: "/tmp/data.json" };
const fromUrl: ReadOptions = { url: "https://example.com/data.json" };
