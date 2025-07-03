export enum RequestType {
  Authenticate = "authenticate",
  Close = "close",
  GetMetadata = "getMetadata",
  GetOutlines = "getOutlines",
  GetPages = "getPages",
  GetImageData = "getImageData",
  GetNodes = "getNodes",
  GetArray = "getArray",
  Open = "open",
  Search = "search",
}

export interface Request {
  id: number;
  type: RequestType;
  args: any[];
}

export interface Response {
  replyTo: number;
  data: any;
}

export interface MuPdfMetadata {
  name: string;
  authors: string[];
  cover: Uint8Array;
}
