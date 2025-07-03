import { type Source } from "@/sources/source";
import { useLogger } from "@/logging";

const { debug } = useLogger("source");

let source: Source;

export async function useSource(): Promise<Source> {
  if (source) return source;

  if ("showOpenFilePicker" in window) {
    const { Fsa } = await import("@/sources/fsa");
    source = new Fsa();
  } else if (navigator.storage) {
    const { Opfs } = await import("@/sources/opfs");
    source = new Opfs();
  } else {
    throw new TypeError("Unknown source");
  }

  debug(`Using source: ${source.name}`);
  return source;
}

export { type Source };
