type LogFn = (message: string) => void;

interface Logger {
  f: (texts: TemplateStringsArray, ...args: any[]) => string;
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
}

function format(domain: string, message: string) {
  return `${domain}: ${message}`;
}

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

export function useLogger(domain: string): Logger {
  return {
    f,
    debug: (message: string) => console.debug(format(domain, message)),
    info: (message: string) => console.info(format(domain, message)),
    warn: (message: string) => console.warn(format(domain, message)),
    error: (message: string) => console.error(format(domain, message)),
  };
}
