import { Constants } from "@/constants";
import { ItemType } from "@/models";

export function getBaseName(path: string): string {
  const baseName = path.split(/[\\/]/).pop();
  if (baseName == undefined) throw new Error(`Invalid path: ${path}`);
  return baseName;
}

export function splitBaseName(baseName: string): { name: string; extension: string } {
  const splits = baseName.split(".");
  if (splits.length == 0) throw new Error(`Invalid base name: ${baseName}`);
  const name = splits[0];
  const extension = splits[splits.length - 1];
  return { name, extension };
}

export function toTitleCase(str: string): string {
  let title = str.replaceAll(/-|_/g, " ");
  title = title
    .split(" ")
    .map((x) => x[0].toLocaleUpperCase() + x.slice(1))
    .join(" ");
  return title;
}

export function itemTypeToString(type: ItemType): string {
  if (type == ItemType.Audiobook) return "Audiobook";
  else if (type == ItemType.Ebook) return "Ebook";
  else throw new Error(`Unknown item type: ${type}`);
}

export function itemTypeToFileTypes(type: ItemType): string[] {
  if (type == ItemType.Audiobook) return Constants.AUDIOBOOK_TYPES;
  else if (type == ItemType.Ebook) return Constants.EBOOK_TYPES;
  else throw new Error(`Unknown item type: ${type}`);
}
