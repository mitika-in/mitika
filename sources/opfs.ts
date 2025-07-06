import { useLogger } from "@/logging";
import { type Filter, extensionToMimeType, mimeTypeToExtension, Source } from "@/sources/source";
import { splitBaseName } from "@/utils";
import { type File as ItemFile } from "@/models";

const { f, debug } = useLogger("opfs");

const ITEMS_DIRECTORY_NAME = "items";

interface OpfsFile extends ItemFile {
  handle: FileSystemFileHandle;
}

export class Opfs extends Source {
  override name = "opfs";
  private itemsDir: FileSystemDirectoryHandle | null = null;

  async getItemsDir(): Promise<FileSystemDirectoryHandle> {
    if (this.itemsDir) return this.itemsDir;
    const root = await navigator.storage.getDirectory();
    this.itemsDir = await root.getDirectoryHandle(ITEMS_DIRECTORY_NAME, { create: true });
    return this.itemsDir;
  }

  private async createFile(file: File): Promise<OpfsFile> {
    const itemsDir = await this.getItemsDir();
    const handleName = window.crypto.randomUUID();
    debug(`Copying ${file.name} to ${handleName}`);
    const handle = await itemsDir.getFileHandle(handleName, { create: true });
    const stream = await handle.createWritable();
    await stream.write(file);
    await stream.close();
    const baseName = file.name;
    const type = extensionToMimeType(splitBaseName(baseName).extension);
    debug(`Copied ${file.name} to ${handleName}`);
    return { name: baseName, type, source: this.name, handle };
  }

  async chooseFiles(multiple: boolean, filters: Filter[]): Promise<OpfsFile[]> {
    debug(f`Choosing files of filters: ${filters} with multiple: ${multiple}`);
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = multiple;
    input.accept = filters
      .map((filter) => filter.types.map((type) => `.${mimeTypeToExtension(type)}`))
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

  async readFile(file: OpfsFile): Promise<Blob> {
    debug(`Reading file: ${file.name}`);
    const blob = await file.handle.getFile();
    return blob;
  }

  override async dropFile(file: OpfsFile): Promise<void> {
    debug(`Dropping file: ${file.name}`);
    const itemsDir = await this.getItemsDir();
    await itemsDir.removeEntry(file.handle.name);
  }
}
