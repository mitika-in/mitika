export class Constants {
  static readonly NAME = "Mitika";
  static readonly VERSION = "0.1";
  static readonly AUDIOBOOK_TYPES: `${string}/${string}`[] = ["audio/mp4", "audio/mpeg"];
  static readonly EBOOK_TYPES: `${string}/${string}`[] = [
    "application/epub+zip",
    "application/pdf",
  ];
  static readonly AUTHORS = "Arun Mani J, Priyank, Suyash Singh Varma and contributors.";
  static readonly WEBSITE = "https://mitika.in";
  static readonly HELP = "https://mitika.in/help";
  static readonly AUDIOBOOK_MIN_RATE = 0.1;
  static readonly AUDIOBOOK_MAX_RATE = 4;
  static readonly AUDIOBOOK_MIN_VOLUME = 0;
  static readonly AUDIOBOOK_MAX_VOLUME = 1;
  static readonly EBOOK_MIN_SCALE = 0.01;
  static readonly EBOOK_MAX_SCALE = 4;
}
