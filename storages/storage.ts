export abstract class Storage {
  name: string = "storage";
  abstract read(path: string): Promise<Blob | null>;
  abstract write(path: string, blob: Blob): Promise<void>;
  abstract remove(path: string): Promise<boolean>;
}
