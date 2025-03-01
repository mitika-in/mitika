<template>
  <div class="flex grow flex-col h-dvh gap-8 p-4">
    <header class="flex flex-row gap-4 items-center">
      <button
        class="btn btn-ghost"
        @click="openNewBook"
      >
        <FolderIcon class="size-4" />
      </button>
      <div class="grow flex justify-center lg:justify-end">
        <label class="input flex items-center gap-2">
          <SearchIcon class="size-4" />
          <input
            v-model.trim="search"
            class="w-full"
            :placeholder="$t('Search by name, authors, tags…')"
            type="text"
          />
        </label>
      </div>
      <Dropdown>
        <template #button>
          <MenuIcon class="size-4" />
        </template>
        <template #content>
          <ul class="menu w-64 rounded-box bg-base-100 shadow-sm">
            <li>
              <details>
                <summary>
                  {{ $t("Tags") }}
                </summary>
                <ul>
                  <li
                    v-for="tag of allTags"
                    :key="tag"
                  >
                    <label class="label">
                      <input
                        :checked="selectedTags.includes(tag)"
                        class="checkbox"
                        type="checkbox"
                        @change="toggleTag(tag)"
                      />
                      {{ tag }}
                    </label>
                  </li>
                </ul>
              </details>
            </li>
            <li>
              <details>
                <summary>
                  {{ $t("Sort") }}
                </summary>
                <ul>
                  <li>
                    <label class="label">
                      <input
                        v-model="sort"
                        class="radio"
                        name="sort"
                        type="radio"
                        :value="Sort.ALPHABETICAL"
                      />
                      {{ $t("A–Z") }}
                    </label>
                  </li>
                  <li>
                    <label class="label">
                      <input
                        v-model="sort"
                        class="radio"
                        name="sort"
                        type="radio"
                        :value="Sort.REVERSE_ALPHABETICAL"
                      />
                      {{ $t("Z–A") }}
                    </label>
                  </li>
                  <li>
                    <label class="label">
                      <input
                        v-model="sort"
                        class="radio"
                        name="sort"
                        type="radio"
                        :value="Sort.RECENT_FIRST"
                      />
                      {{ $t("Recent first") }}
                    </label>
                  </li>
                  <li>
                    <label class="label">
                      <input
                        v-model="sort"
                        class="radio"
                        name="sort"
                        type="radio"
                        :value="Sort.RECENT_LAST"
                      />
                      {{ $t("Recent last") }}
                    </label>
                  </li>
                </ul>
              </details>
            </li>
            <li>
              <button>
                {{ $t("Help") }}
              </button>
            </li>
            <li>
              <button>
                {{ $t("About {name}", { name: Constants.NAME }) }}
              </button>
            </li>
          </ul>
        </template>
      </Dropdown>
    </header>
    <main class="grow">
      <Status
        v-if="filteredBooks.length == 0"
        :action="$t('Open New Book')"
        class="h-full"
        :description="$t('Add a few books to open them here.')"
        :title="books.length == 0 ? $t('Library is empty') : $t('No such book')"
        type="info"
        @click="openNewBook"
      />
      <div
        v-else
        class="grid gap-4 place-items-center grid-cols-[repeat(auto-fill,minmax(256px,1fr))]"
      >
        <BookItem
          v-for="book of filteredBooks"
          :key="book.id"
          :book="book"
          @edit="editBook(book)"
          @open="openBook(book)"
          @remove="removeBook(book)"
        />
      </div>
    </main>
  </div>
</template>
<script setup lang="ts">
import { useLogger } from "@/logging";
import { type Book, createAudiobook, createBook, createEbook } from "@/models";
import { Constants } from "@/constants";
import { useDatabase } from "@/database";
import { useStorage } from "@/storages";
import { toTitleCase, splitBaseName } from "@/utils";
import { useSettings } from "@/settings";

const { f, debug } = useLogger("home");

enum Sort {
  ALPHABETICAL = "alphabetical",
  RECENT_FIRST = "recentFirst",
  RECENT_LAST = "recentLast",
  REVERSE_ALPHABETICAL = "reverseAlphabetical",
}

const { t } = useI18n();
const dialog = inject("dialog")!;

const database = await useDatabase();
const storage = await useStorage();
const settings = await useSettings();

const search = ref("");
const sort: Ref<string> = ref(await settings.get("home.sort", Sort.RECENT_FIRST));
const books: Ref<Book[]> = ref(await database.getBooks());

const allTags: Ref<string[]> = ref([]);
const selectedTags: Ref<string[]> = ref([]);

const sortedBooks = computed(() =>
  books.value.toSorted(function (a, b) {
    const order = sort.value;
    if (order == Sort.ALPHABETICAL) return a.name.localeCompare(b.name);
    if (order == Sort.RECENT_FIRST)
      return (b.lastOpened > a.lastOpened ? 1 : 0) - (b.lastOpened < a.lastOpened ? 1 : 0);
    if (order == Sort.RECENT_LAST)
      return (a.lastOpened > b.lastOpened ? 1 : 0) - (a.lastOpened < b.lastOpened ? 1 : 0);
    if (order == Sort.REVERSE_ALPHABETICAL) return b.name.localeCompare(a.name);
    return 0;
  }),
);

const filteredBooks = computed(() =>
  sortedBooks.value.filter(
    (book) =>
      (allTags.value.length == selectedTags.value.length ||
        new Set(book.tags).intersection(new Set(selectedTags.value)).size != 0) &&
      `${book.name} ${book.authors} ${book.tags.join()}`
        .toLowerCase()
        .includes(search.value.toLowerCase()),
  ),
);

watch(sort, async (newSort) => await settings.set("home.sort", newSort));

async function refreshBooks() {
  const newBooks = await database.getBooks();
  const tags: Set<string> = new Set();
  for (const book of newBooks) for (const tag of book.tags) tags.add(tag);
  allTags.value = [...tags.values()].toSorted();
  selectedTags.value = selectedTags.value.filter((tag) => allTags.value.includes(tag));
  books.value = newBooks;
}

function toggleTag(tag: string) {
  let idx = selectedTags.value.indexOf(tag);
  if (idx == -1) selectedTags.value.push(tag);
  else selectedTags.value.splice(idx, 1);
}

async function openNewBook() {
  const files = await storage.chooseFiles(true, [
    {
      name: t("Book"),
      types: [...Constants.AUDIOBOOK_TYPES, ...Constants.EBOOK_TYPES],
    },
  ]);
  if (files.length == 0) return;

  const book = await database.addBook(createBook(toTitleCase(splitBaseName(files[0].name).name)));
  const items = [];
  for (const file of files) {
    const name = toTitleCase(splitBaseName(file.name).name);
    let item;
    if (Constants.AUDIOBOOK_TYPES.includes(file.type)) item = createAudiobook(book.id, name, file);
    else if (Constants.EBOOK_TYPES.includes(file.type)) item = createEbook(book.id, name, file);
    else throw new Error(`Unknown type: ${file.type}`);
    items.push(item);
  }
  await database.updateItems(book.id, items, [], []);
  await refreshBooks();
}

async function openBook(book: Book) {
  await navigateTo(`/open/${book.id}`);
}

async function editBook(book: Book) {
  await navigateTo(`/edit/${book.id}`);
}

async function removeBook(book: Book) {
  const title = t("Remove {name}?", { name: book.name });
  const message = t(
    "Removing a book clears its bookmarks, notes etc. However the book's files are not deleted.",
  );
  const buttons = [
    { action: "cancel", text: t("Cancel"), type: "normal" },
    { action: "remove", text: t("Remove"), type: "destructive" },
  ];
  await dialog.value.show(title, message, buttons, async (action) => {
    if (action == "remove") {
      debug(`Removing book: ${book.id}`);

      const items = await database.getItems(book.id);
      for (const item of items) {
        debug(f`Dropping item file: ${item.file}`);
        await storage.dropFile(toRaw(item).file);
      }

      if ((await storage.readCache(`${book.id}_cover.png`)) != null) {
        debug("Dropping cover image");
        await storage.dropCache(`${book.id}_cover.png`);
      }

      await database.delBook(book);
      await refreshBooks();
    }
  });
}

await refreshBooks();
selectedTags.value = [...allTags.value];

const u = ref({ x: 10, y: 100 });
const v = ref({ x: 10, y: { z: 10 } });
</script>
