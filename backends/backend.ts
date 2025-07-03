import { type Metadata } from "@/backends/metadata";
import { type Outline } from "@/backends/outline";

export type PasswordRequiredCallback = (
  callback: (password: string) => void,
  retry: boolean,
) => void;

export interface InitOptions {}

export interface BackendOptions {
  passwordCb: PasswordRequiredCallback;
}

export abstract class Backend {
  constructor(backendOptions: BackendOptions, initOptions: InitOptions) {}
  abstract open(blob: Blob, mimeType: string): Promise<void>;
  abstract close(): Promise<void>;
  abstract getMetadata(): Promise<Metadata>;
  abstract getOutlines(): Promise<Outline[]>;
}
