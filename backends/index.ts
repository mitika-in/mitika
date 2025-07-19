import { type AudiobookBackend, type AudiobookOutline } from "@/backends/audiobook";
import { type EbookBackend, type EbookOutline } from "@/backends/ebook";
import { type Outline, type Metadata } from "@/backends/backend";
import { HtmlAudio } from "@/backends/htmlAudio";
import { MuPdf } from "@/backends/muPdf";

export function useAudiobookBackend(type: string): AudiobookBackend {
  if (type == "audio/mp4") return new HtmlAudio();
  if (type == "audio/mpeg") return new HtmlAudio();
  throw new Error(`Unknown audiobook type: ${type}`);
}

export function useEbookBackend(type: string): EbookBackend {
  if (type == "application/pdf") return new MuPdf();
  if (type == "application/epub+zip") return new MuPdf();
  else throw new Error(`Unknown ebook type: ${type}`);
}

export {
  type AudiobookBackend,
  type AudiobookOutline,
  type EbookBackend,
  type EbookOutline,
  type Metadata,
  type Outline,
};
