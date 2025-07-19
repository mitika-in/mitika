/// <reference types="wicg-file-system-access" />
import { useLogger } from "@/logging";
import { type Filter, extensionToMimeType, mimeTypeToExtension, Source } from "@/sources/source";
import { splitBaseName } from "@/utils";
import { type File as ItemFile } from "@/models";

const { f, debug } = useLogger("fsa");

interface FsaFile extends ItemFile {
  handle: FileSystemFileHandle;
}

export class Fsa extends Source {
  override name = "fsa";

  async chooseFiles(multiple: boolean, filters: Filter[]): Promise<FsaFile[]> {
    debug(f`Choosing files of filters: ${filters} with multiple: ${multiple}`);
    const types: FilePickerAcceptType[] = [];
    for (const filter of filters) {
      const description = filter.name;
      const accept: Record<MIMEType, FileExtension> = {};
      for (const type of filter.types) accept[type] = `.${mimeTypeToExtension(type)}`;
      types.push({ description, accept });
    }

    const handles: FileSystemFileHandle[] = await window.showOpenFilePicker({
      excludeAcceptAllOption: true,
      multiple,
      startIn: "documents",
      types,
    });

    const files = handles.map((handle) => {
      const baseName = handle.name;
      const type = extensionToMimeType(splitBaseName(baseName).extension);
      return {
        name: baseName,
        type,
        source: this.name,
        handle,
      };
    });

    return files;
  }

  async readFile(file: FsaFile): Promise<Blob> {
    if (!((await file.handle.queryPermission({ mode: "read" })) == "granted"))
      if (!((await file.handle.requestPermission({ mode: "read" })) == "granted"))
        throw Error(`Permission denied to read ${file.name}`);
    const blob = await file.handle.getFile();
    return blob;
  }
}
