type LogDetail = Record<string, string | number | boolean | null>;

/** Development-only logs. Never pass signed envelopes, secrets, or personal notes. */
export function devLog(event: string, detail: LogDetail = {}): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  console.info("[kobopot]", event, detail);
}
