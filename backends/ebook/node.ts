export enum NodeType {
  ExternalLink,
  InternalLink,
  Text,
}

export interface Node {
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface InternalLinkNode extends Node {
  position: { value: number; x: number; y: number };
}

export interface ExternalLinkNode extends Node {
  uri: string;
}

export interface Font {
  size: number;
  family: string;
  weight: string;
  style: string;
}

export interface TextNode extends Node {
  text: string;
  font: Font;
}
