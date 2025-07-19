import { type File } from "@/models";

export function extensionToMimeType(extension: string): `${string}/${string}` {
  switch (extension) {
    case "epub":
      return "application/epub+zip";
    case "m4b":
      return "audio/mp4";
    case "mp3":
      return "audio/mpeg";
    case "pdf":
      return "application/pdf";
    default:
      throw TypeError(`Unknown extension: ${extension}`);
  }
}

export function mimeTypeToExtension(type: `${string}/${string}`): string {
  switch (type) {
    case "application/epub+zip":
      return "epub";
    case "audio/mp4":
      return "m4b";
    case "audio/mpeg":
      return "mp3";
    case "application/pdf":
      return "pdf";
    default:
      throw TypeError(`Unknown MIME type: ${type}`);
  }
}

export interface Filter {
  name: string;
  types: `${string}/${string}`[];
}

export abstract class Source {
  name: string = "source";
  abstract chooseFiles(multiple: boolean, filters: Filter[]): Promise<File[]>;
  abstract readFile(file: File): Promise<Blob>;
  async dropFile(file: File): Promise<void> {}
}
