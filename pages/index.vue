<template>
  <div class="flex flex-col gap-8 p-4">
    <header class="flex flex-row items-center gap-4">
      <button
        class="btn btn-ghost"
        @click="onOpenClick"
      >
        <FolderIcon class="size-4" />
      </button>
      <div class="flex grow justify-center lg:justify-end">
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
      <Dropdown popoverId="indexPo">
        <template #button>
          <MenuIcon class="size-4" />
        </template>
        <template #content>
          <ul class="menu bg-base-100 w-64 rounded-sm shadow-sm">
            <li v-if="allTags.length != 0">
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
                        @change="onTagChange(tag)"
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
                        :value="Sort.Alphabetical"
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
                        :value="Sort.ReverseAlphabetical"
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
                        :value="Sort.RecentFirst"
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
                        :value="Sort.RecentLast"
                      />
                      {{ $t("Recent last") }}
                    </label>
                  </li>
                </ul>
              </details>
            </li>
            <li>
              <NuxtLink to="/logs">
                {{ $t("Logs") }}
              </NuxtLink>
            </li>
            <li>
              <button>
                {{ $t("Help") }}
              </button>
            </li>
            <li>
              <button @click="aboutDialog!.toggle()">
                {{ $t("About {name}", { name: Constants.NAME }) }}
              </button>
            </li>
          </ul>
        </template>
      </Dropdown>
    </header>
    <main class="h-0 grow overflow-scroll">
      <Status
        v-if="filteredBooks.length == 0"
        :action="$t('Open New Book')"
        class="h-full"
        :description="$t('Add a few books to open them here.')"
        :title="books.length == 0 ? $t('Library is empty') : $t('No such book')"
        :type="StatusType.Info"
        @click="onOpenClick"
      />
      <div
        v-else
        class="grid grid-cols-[repeat(auto-fill,minmax(256px,1fr))] place-items-center gap-4"
      >
        <BookItem
          v-for="book of filteredBooks"
          :key="book.id"
          :book="book"
          @edit="onBookEdit(book)"
          @open="onBookOpen(book)"
          @remove="onBookRemove(book)"
        />
      </div>
    </main>
    <AboutDialog ref="aboutDialog" />
    <MessageDialog ref="messageDialog" />
  </div>
</template>
<script lang="ts" setup>
import { ButtonType } from "@/components/buttonType";
import { StatusType } from "@/components/statusType";
import { Constants } from "@/constants";
import { useDatabase } from "@/database";
import { useLogger } from "@/logging";
import { type Book, createAudiobook, createBook, createEbook } from "@/models";
import { useSource } from "@/sources";
import { useStorage } from "@/storages";
import { toTitleCase, splitBaseName } from "@/utils";

const { f, debug } = useLogger("home");
const { t } = useI18n();

enum Sort {
  Alphabetical = "alphabetical",
  RecentFirst = "recentFirst",
  RecentLast = "recentLast",
  ReverseAlphabetical = "reverseAlphabetical",
}

const database = await useDatabase();
const source = await useSource();
const storage = await useStorage();

const aboutDialog = useTemplateRef("aboutDialog");
const messageDialog = useTemplateRef("messageDialog")!;

const search = ref("");
const sort: Ref<string> = ref(await database.getProperty("home.sort", Sort.RecentFirst));
const books: Ref<Book[]> = ref(await database.getBooks());

const allTags: Ref<string[]> = ref([]);
const selectedTags: Ref<string[]> = ref([]);

const sortedBooks = computed(() =>
  books.value.toSorted(function (a, b) {
    const order = sort.value;
    if (order == Sort.Alphabetical) return a.name.localeCompare(b.name);
    if (order == Sort.RecentFirst)
      return (b.lastOpened > a.lastOpened ? 1 : 0) - (b.lastOpened < a.lastOpened ? 1 : 0);
    if (order == Sort.RecentLast)
      return (a.lastOpened > b.lastOpened ? 1 : 0) - (a.lastOpened < b.lastOpened ? 1 : 0);
    if (order == Sort.ReverseAlphabetical) return b.name.localeCompare(a.name);
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

async function refreshBooks() {
  const newBooks = await database.getBooks();
  const tags: Set<string> = new Set();
  for (const book of newBooks) for (const tag of book.tags) tags.add(tag);
  allTags.value = [...tags.values()].toSorted();
  selectedTags.value = selectedTags.value.filter((tag) => allTags.value.includes(tag));
  books.value = newBooks;
}

function onTagChange(tag: string) {
  let idx = selectedTags.value.indexOf(tag);
  if (idx == -1) selectedTags.value.push(tag);
  else selectedTags.value.splice(idx, 1);
}

async function onOpenClick() {
  const files = await source.chooseFiles(true, [
    {
      name: t("Book"),
      types: [...Constants.AUDIOBOOK_TYPES, ...Constants.EBOOK_TYPES],
    },
  ]);
  if (files.length == 0) return;

  const book = createBook(toTitleCase(splitBaseName(files[0].name).name));
  await database.putBook(book);
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

async function onBookOpen(book: Book) {
  await navigateTo(`/open/${book.id}`);
}

async function onBookEdit(book: Book) {
  await navigateTo(`/edit/${book.id}`);
}

async function onBookRemove(book: Book) {
  const title = t("Remove {name}?", { name: book.name });
  const message = t(
    "Removing a book clears its bookmarks, notes etc. However the book's files are not deleted.",
  );
  const buttons = [
    { action: "cancel", text: t("Cancel"), type: ButtonType.Normal },
    { action: "remove", text: t("Remove"), type: ButtonType.Destructive },
  ];
  await messageDialog.value!.show(title, message, buttons, async (action: string) => {
    if (action == "remove") {
      debug(`Removing book: ${book.id}`);

      const items = await database.getItems(book.id);
      for (const item of items) {
        debug(f`Dropping item file: ${item.file}`);
        await source.dropFile(toRaw(item).file);
      }

      debug("Removing cover image");
      await storage.remove(`/covers/${book.id}.png`);

      await database.delBook(book);
      await refreshBooks();
    }
  });
}

watch(sort, async (newSort) => await database.setProperty("home.sort", newSort));

await refreshBooks();
selectedTags.value = [...allTags.value];
</script>
