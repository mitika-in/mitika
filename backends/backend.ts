export type PasswordRequiredCallback = (
  callback: (password: string) => void,
  retry: boolean,
) => void;

export interface BackendOptions {
  passwordCb: PasswordRequiredCallback;
}

export interface Metadata {
  name: string;
  authors: string[];
  cover: Blob | null;
}

export interface Outline {
  id: string;
  name: string;
  position: any;
  children: Outline[];
}

export interface Backend {
  open(blob: Blob, type: string, options: BackendOptions): Promise<void>;
  close(): Promise<void>;
  getMetadata(): Promise<Metadata>;
  getOutlines(): Promise<Outline[]>;
}
