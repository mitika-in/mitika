import {
  type AudiobookBackend,
  type AudiobookBackendOptions,
  type AudiobookInitOptions,
} from "@/backends/audiobook";
import {
  type EbookBackend,
  type EbookBackendOptions,
  type EbookInitOptions,
} from "@/backends/ebook";
import { HtmlAudio } from "@/backends/htmlAudio";
import { MuPdf } from "@/backends/muPdf";

export function useAudiobookBackend(
  type: string,
): new (
  backendOptions: AudiobookBackendOptions,
  initOptions: AudiobookInitOptions,
) => AudiobookBackend {
  if (type == "audio/mp4") return HtmlAudio;
  if (type == "audio/mpeg") return HtmlAudio;
  throw new Error(`Unknown audiobook type: ${type}`);
}

export function useEbookBackend(
  type: string,
): new (backendOptions: EbookBackendOptions, initOptions: EbookInitOptions) => EbookBackend {
  if (type == "application/pdf") return MuPdf;
  if (type == "application/epub+zip") return MuPdf;
  else throw new Error(`Unknown ebook type: ${type}`);
}

export { type AudiobookBackend, type EbookBackend };
