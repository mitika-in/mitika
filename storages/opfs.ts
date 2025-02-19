import { useLogger } from "@/logging";

import { type File as InternalFile } from "@/models";
import { type Filter, Storage, extensionToType, typeToExtension } from "@/storages/storage";
import { splitBaseName } from "@/utils";

const { debug } = useLogger("opfs");

const NAME = "opfs";

interface OpfsFile extends InternalFile {
  handle: FileSystemFileHandle;
}

export class Opfs extends Storage {
  override name = NAME;
  root: FileSystemDirectoryHandle | null = null;
  cache: FileSystemDirectoryHandle | null = null;

  private async getRoot(): Promise<FileSystemDirectoryHandle> {
    if (this.root) return this.root;
    this.root = await navigator.storage.getDirectory();
    return this.root;
  }

  private async getCache(): Promise<FileSystemDirectoryHandle> {
    if (this.cache) return this.cache;
    const root = await this.getRoot();
    this.cache = await root.getDirectoryHandle("cache", { create: true });
    return this.cache;
  }

  private async createFile(file: File): Promise<OpfsFile> {
    const root = await this.getRoot();
    const id = `${file.name}-${file.size}-${file.lastModified}`;
    debug(`Creating file: ${id}`);
    const handleName = window.crypto.randomUUID();
    const handle = await root.getFileHandle(handleName, { create: true });
    const stream = await handle.createWritable();
    await stream.write(file);
    await stream.close();
    const baseName = file.name;
    const type = extensionToType(splitBaseName(baseName).extension);
    debug(`Created file: ${id}`);
    return { id, name: baseName, type, storage: this.name, handle };
  }

  async chooseFiles(multiple: boolean, filters: Filter[]): Promise<OpfsFile[]> {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = multiple;
    input.accept = filters
      .map((filter) => filter.types.map((type) => `.${typeToExtension(type)}`))
      .flat()
      .join(",");

    const files: OpfsFile[] = await new Promise((resolve) => {
      input.oncancel = () => resolve([]);
      input.onchange = async () => {
        if (!input.files) return resolve([]);
        const files: OpfsFile[] = [];
        for (const file of input.files) files.push(await this.createFile(file));
        resolve(files);
      };
      input.click();
    });

    return files;
  }

  override async dropFile(file: OpfsFile): Promise<void> {
    debug(`Dropping file: ${file.id}`);
    const root = await this.getRoot();
    await root.removeEntry(file.handle.name);
  }

  async readFile(file: OpfsFile): Promise<Blob> {
    debug(`Reading file: ${file.id}`);
    const blob = await file.handle.getFile();
    return blob;
  }

  async writeCache(name: string, blob: Blob): Promise<void> {
    debug(`Writing cache: ${name}`);
    const cache = await this.getCache();
    const handle = await cache.getFileHandle(name, { create: true });
    const stream = await handle.createWritable();
    await stream.write(blob);
    await stream.close();
    debug(`Written cache: ${name}`);
  }

  async readCache(name: string): Promise<Blob | null> {
    debug(`Reading cache: ${name}`);
    const cache = await this.getCache();
    let handle;
    try {
      handle = await cache.getFileHandle(name);
    } catch (error) {
      if (error instanceof DOMException && error.name == "NotFoundError") return null;
      throw error;
    }
    const blob = handle.getFile();
    return blob;
  }

  async dropCache(name: string): Promise<void> {
    debug(`Dropping cache: ${name}`);
    const cache = await this.getCache();
    await cache.removeEntry(name);
  }
}
