type LogFn = (message: string) => void;

interface Logger {
  f: (texts: TemplateStringsArray, ...args: any[]) => string;
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
}

export enum Level {
  Debug = "debug",
  Info = "info",
  Warn = "warn",
  Error = "error",
}

interface Log {
  level: Level;
  domain: string;
  message: string;
}

const MAXIMUM_LOGS = 1024;
const LOGS: Log[] = [];

function f(texts: TemplateStringsArray, ...args: any[]): string {
  const splits = [];

  for (let i = 0; i < args.length; i++) {
    splits.push(texts[i]);
    let arg = args[i];
    if (typeof arg == "undefined") arg = JSON.stringify(null);
    else if (typeof arg != "string") arg = JSON.stringify(arg);
    splits.push(arg);
  }
  splits.push(texts[texts.length - 1]);

  return splits.join("");
}

function format(domain: string, message: string) {
  return `${domain}: ${message}`;
}

function log(level: Level, domain: string, message: string) {
  switch (level) {
    case Level.Debug:
      console.debug(format(domain, message));
      break;
    case Level.Info:
      console.info(format(domain, message));
      break;
    case Level.Warn:
      console.warn(format(domain, message));
      break;
    case Level.Error:
      console.error(format(domain, message));
      break;
    default:
      throw new Error(`Unknown level: ${level}`);
  }

  LOGS.push({ level, domain, message });
  while (LOGS.length > MAXIMUM_LOGS) LOGS.pop();
}

export function useLogger(domain: string): Logger {
  return {
    f,
    debug: (message: string) => log(Level.Debug, domain, message),
    info: (message: string) => log(Level.Info, domain, message),
    warn: (message: string) => log(Level.Warn, domain, message),
    error: (message: string) => log(Level.Error, domain, message),
  };
}

export function useLogs(): Log[] {
  return LOGS;
}
