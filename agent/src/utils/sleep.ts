export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomDelay(baseMs: number, jitterMs: number): Promise<void> {
  return sleep(baseMs + Math.random() * jitterMs);
}
