export interface Book {
  id: string;
  name: string;
  authors: string[];
  lastAudiobookId: string | null;
  lastEbookId: string | null;
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
    lastOpened: new Date(),
    tags: [],
  };
}
