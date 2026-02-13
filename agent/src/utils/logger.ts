export function createLogger(prefix: string) {
  const fmt = (level: string, msg: string) =>
    `[${new Date().toISOString()}] [${level}] [${prefix}] ${msg}`;

  return {
    info: (msg: string, ...args: any[]) => console.log(fmt("INFO", msg), ...args),
    warn: (msg: string, ...args: any[]) => console.warn(fmt("WARN", msg), ...args),
    error: (msg: string, ...args: any[]) => console.error(fmt("ERROR", msg), ...args),
    debug: (msg: string, ...args: any[]) => {
      if (process.env.DEBUG) console.log(fmt("DEBUG", msg), ...args);
    },
  };
}
