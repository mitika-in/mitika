import { useLogger } from "@/logging";
import { Storage } from "@/storages/storage";

const { debug } = useLogger("opfs");

export class Opfs extends Storage {
  override name = "opfs";

  private split(path: string): { segments: string[]; fileName: string } {
    if (!path.startsWith("/") || path.endsWith("/")) throw new Error(`Invalid path: ${path}`);

    let segments = path.split("/");
    segments.shift();

    const fileName = segments.pop();
    if (!fileName) throw new Error(`Invalid path: ${path}`);

    return { segments, fileName };
  }

  private async getDirectory(
    segments: string[],
    create: boolean = false,
  ): Promise<FileSystemDirectoryHandle> {
    let dir = await navigator.storage.getDirectory();
    for (let i = 0; i <= segments.length - 1; i++) {
      dir = await dir.getDirectoryHandle(segments[i], { create });
    }
    return dir;
  }

  async read(path: string): Promise<Blob | null> {
    const { segments, fileName } = this.split(path);
    debug(`Reading ${fileName}`);

    let directory;
    try {
      directory = await this.getDirectory(segments);
    } catch {
      return null;
    }

    let handle;
    try {
      handle = await directory.getFileHandle(fileName);
    } catch {
      return null;
    }

    const blob = await handle.getFile();
    return blob;
  }

  async write(path: string, blob: Blob) {
    const { segments, fileName } = this.split(path);
    debug(`Writing ${fileName}`);
    const directory = await this.getDirectory(segments, true);
    const handle = await directory.getFileHandle(fileName, { create: true });
    const stream = await handle.createWritable();
    await stream.write(blob);
    await stream.close();
    debug(`Wrote ${fileName}`);
  }

  async remove(path: string): Promise<boolean> {
    const { segments, fileName } = this.split(path);
    debug(`Removing ${fileName}`);

    let directory;
    try {
      directory = await this.getDirectory(segments);
    } catch {
      return false;
    }

    try {
      await directory.removeEntry(fileName);
    } catch {
      return false;
    }

    return true;
  }
}
