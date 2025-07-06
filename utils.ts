import { Constants } from "@/constants";
import { ItemType, type Position, type EbookPosition } from "@/models";

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
    .map((x) => x.slice(0, 1).toLocaleUpperCase() + x.slice(1))
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

export function formatToTimestamp(value: number, hoursLength: number = 0): string {
  let delta = value;
  const hours = Math.floor(delta / 3600);
  delta = delta % 3600;
  const minutes = Math.floor(delta / 60);
  delta = delta % 60;
  const seconds = Math.floor(delta);

  const hoursStr = hours.toString().padStart(hoursLength, "0");
  const minsStr = minutes.toString().padStart(2, "0");
  const secsStr = seconds.toString().padStart(2, "0");

  return `${hoursStr}:${minsStr}:${secsStr}`;
}

export function formatPosition(position: Position, type: ItemType): string {
  if (type == ItemType.Audiobook) return formatToTimestamp(position.value);
  else if (type == ItemType.Ebook) return (position as EbookPosition).name;
  else throw new Error(`Unknow item type: ${type}`);
}
