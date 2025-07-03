import { useLogger } from "@/logging";
import { type Storage } from "@/storages/storage";

const { debug } = useLogger("storage");

let storage: Storage;

export async function useStorage(): Promise<Storage> {
  if (storage) return storage;

  if (navigator.storage) {
    const { Opfs } = await import("@/storages/opfs");
    storage = new Opfs();
  } else {
    throw new TypeError("Unknown storage");
  }

  debug(`Using storage: ${storage.name}`);
  return storage;
}

export { type Storage };
