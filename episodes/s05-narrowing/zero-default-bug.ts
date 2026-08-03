type RetryOptions = { retries?: number; label?: string };
const DEFAULT_RETRIES = 3;
const DEFAULT_LABEL = "(제목 없음)";

const options: RetryOptions = { retries: 0, label: "" };
const effectiveRetries = options.retries || DEFAULT_RETRIES;
const effectiveLabel = options.label || DEFAULT_LABEL;

console.log("retries:", effectiveRetries);
console.log("label:", JSON.stringify(effectiveLabel));
