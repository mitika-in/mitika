<template>
  <div class="flex flex-col gap-8 p-4">
    <header class="flex flex-row items-center gap-4">
      <button
        class="btn btn-ghost"
        @click="onBackClick"
      >
        <BackIcon />
      </button>
      <TitleBar
        class="grow"
        subtitle=""
        :title="$t('Logs')"
      />
      <button
        class="btn btn-ghost"
        @click="onDownloadClick"
      >
        <DownloadIcon class="size-4" />
      </button>
    </header>
    <main class="flex grow flex-col gap-4">
      <p>
        Logs are generated by different components and pages of Mitika. If you faced any error, this
        can be a good place to investigate what went wrong. To report the issue to developers,
        please download the relevant logs and upload it to our <a class="link">issue tracker</a>.
      </p>
      <div class="flex flex-row flex-wrap gap-4">
        <label class="flex flex-row items-center gap-2">
          <input
            type="checkbox"
            :checked="levels.has(Level.Debug)"
            class="checkbox checkbox-info"
            @change="onLevelChange(Level.Debug)"
          />
          Debug
        </label>
        <label class="flex flex-row items-center gap-2">
          <input
            type="checkbox"
            :checked="levels.has(Level.Info)"
            class="checkbox checkbox-success"
            @change="onLevelChange(Level.Info)"
          />
          Info
        </label>
        <label class="flex flex-row items-center gap-2">
          <input
            type="checkbox"
            :checked="levels.has(Level.Warn)"
            class="checkbox checkbox-warning"
            @change="onLevelChange(Level.Warn)"
          />
          Warn
        </label>
        <label class="flex flex-row items-center gap-2">
          <input
            type="checkbox"
            :checked="levels.has(Level.Error)"
            class="checkbox checkbox-error"
            @change="onLevelChange(Level.Error)"
          />
          Error
        </label>
      </div>
      <Dropdown
        v-if="allDomains.size != 0"
        buttonClass=""
        dropdownClass=""
        popoverId="logsPo"
      >
        <template #button> Domains</template>
        <template #content>
          <ul class="menu bg-base-100 max-h-[75vh] w-64 overflow-scroll rounded-sm shadow-sm">
            <li
              v-for="domain of allDomains"
              :key="domain"
            >
              <label class="label">
                <input
                  type="checkbox"
                  :checked="domains.has(domain)"
                  class="checkbox"
                  @change="onDomainChange(domain)"
                />
                <span class="font-mono">{{ domain }}</span>
              </label>
            </li>
          </ul>
        </template>
      </Dropdown>
      <div class="flex grow flex-row">
        <div class="w-0 grow overflow-scroll">
          <table class="table-zebra table-pin-rows table">
            <thead>
              <tr>
                <th>
                  {{ $t("Level") }}
                </th>
                <th>
                  {{ $t("Domain") }}
                </th>
                <th>
                  {{ $t("Message") }}
                </th>
              </tr>
            </thead>
            <tbody class="font-mono">
              <template v-if="filteredLogs.length != 0">
                <tr v-for="log in filteredLogs">
                  <td>{{ log.level }}</td>
                  <td>{{ log.domain }}</td>
                  <td>{{ log.message }}</td>
                </tr>
              </template>
              <tr v-else-if="logs.length != 0">
                <td>-</td>
                <td>-</td>
                <td>{{ $t("Logs are empty. Try relaxing the filters.") }}</td>
              </tr>
              <tr v-else>
                <td>-</td>
                <td>-</td>
                <td>{{ $t("Logs are empty.") }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>
<script setup lang="ts">
import { Constants } from "@/constants";
import { useLogs, Level } from "@/logging";

const router = useRouter();

const logs = ref(useLogs());
const allDomains = ref(new Set(logs.value.map((log) => log.domain).sort()));
const levels = ref(new Set([Level.Debug, Level.Info, Level.Warn, Level.Error]));

const domains = ref(new Set(allDomains.value));
const filteredLogs = computed(() => {
  return logs.value.filter((log) => levels.value.has(log.level) && domains.value.has(log.domain));
});

function onBackClick() {
  router.back();
}

function onDownloadClick() {
  const a = document.createElement("a");
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(filteredLogs.value, null, 2)], { type: "application/json" }),
  );
  a.href = url;
  a.download = `${Constants.NAME}_logs.json`;
  a.click();
}

function onLevelChange(level: Level) {
  if (levels.value.has(level)) levels.value.delete(level);
  else levels.value.add(level);
}

function onDomainChange(domain: string) {
  if (domains.value.has(domain)) domains.value.delete(domain);
  else domains.value.add(domain);
}

useHead({
  title: "Logs",
});
</script>
