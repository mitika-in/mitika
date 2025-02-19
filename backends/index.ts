import { type AudiobookBackend } from "@/backends/audiobook";
import { type EbookBackend, type EbookPageView } from "@/backends/ebook";
import { HtmlAudio } from "@/backends/htmlAudio";
import { PdfJs } from "@/backends/pdfJs";

export function useAudiobookBackend(type: string): new () => AudiobookBackend {
  if (true) return HtmlAudio;
  throw new Error(`Unknown audiobook extension: ${type}`);
}

export function useEbookBackend(type: string): new () => EbookBackend {
  if (type == "pdf") return PdfJs;
  else throw new Error(`Unknown ebook extension: ${type}`);
}

export { type AudiobookBackend, type EbookBackend, type EbookPageView };
