export interface Book {
  id: string;
  name: string;
  authors: string[];
  lastAudiobookId: string | null;
  lastEbookId: string | null;
  openAudiobook: boolean;
  openEbook: boolean;
  lastOpened: Date;
  tags: string[];
}

export function createBook(name: string): Book {
  return {
    id: window.crypto.randomUUID(),
    name,
    authors: [],
    lastAudiobookId: null,
    lastEbookId: null,
    openAudiobook: true,
    openEbook: true,
    lastOpened: new Date(),
    tags: [],
  };
}
