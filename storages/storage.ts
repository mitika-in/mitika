import { type File } from "@/models";

export function extensionToType(extension: string): string {
  switch (extension) {
    case "epub":
      return "epub";
    case "m4b":
      return "m4b";
    case "mp3":
      return "mp3";
    case "pdf":
      return "pdf";
    default:
      throw TypeError(`Unknown extension: ${extension}`);
  }
}

export function typeToExtension(type: string): string {
  switch (type) {
    case "epub":
      return "epub";
    case "m4b":
      return "m4b";
    case "mp3":
      return "mp3";
    case "pdf":
      return "pdf";
    default:
      throw TypeError(`Unknown type: ${type}`);
  }
}

export class StorageFileNotFoundError extends Error {
  constructor(
    public fileId: string,
    public fileName: string,
  ) {
    super(`File not found: $${fileName} (${fileId})`);
  }
}

export interface Filter {
  name: string;
  types: string[];
}

export abstract class Storage {
  name: string = "storage";
  abstract chooseFiles(multiple: boolean, filters: Filter[]): Promise<File[]>;
  abstract readFile(file: File): Promise<Blob>;
  async dropFile(file: File): Promise<void> {}
  abstract writeCache(name: string, blob: Blob): Promise<void>;
  abstract readCache(name: string): Promise<Blob | null>;
  abstract dropCache(name: string): Promise<void>;
}
