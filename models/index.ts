import { type Audiobook, createAudiobook } from "@/models/audiobook";
import { type Book, createBook } from "@/models/book";
import { ColorScheme } from "@/models/colorScheme";
import {
  type Ebook,
  type EbookColor,
  type EbookPosition,
  EbookLayout,
  createEbook,
} from "@/models/ebook";
import { type File } from "@/models/file";
import { type Item, ItemType } from "@/models/item";
import { type Mark, createMark } from "@/models/mark";
import { type Note, createNote } from "@/models/note";
import { type Position } from "@/models/position";

export type { Audiobook, Book, Ebook, EbookColor, EbookPosition, File, Item, Mark, Note, Position };
export {
  createAudiobook,
  createBook,
  createEbook,
  createMark,
  createNote,
  ColorScheme,
  EbookLayout,
  ItemType,
};
