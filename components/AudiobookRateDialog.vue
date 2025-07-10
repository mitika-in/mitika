<template>
  <Dialog ref="dialog">
    <div class="flex flex-col gap-4">
      <div class="flex flex-row gap-2">
        <TitleBar
          class="grow"
          subtitle=""
          :title="$t('Rate')"
        />
        <button
          class="btn btn-ghost"
          @click="dialog!.hide()"
        >
          <XIcon class="size-4" />
        </button>
      </div>
      <ul class="menu w-full">
        <li>
          <label class="label">
            <input
              v-model="rateInput"
              class="radio"
              name="rate"
              type="radio"
              :value="0.25"
              @change="$emit('change', 0.25)"
            />
            {{ $t("0.25x") }}
          </label>
        </li>
        <li>
          <label class="label">
            <input
              v-model="rateInput"
              class="radio"
              name="rate"
              type="radio"
              :value="0.5"
              @change="$emit('change', 0.5)"
            />
            {{ $t("0.5x") }}
          </label>
        </li>
        <li>
          <label class="label">
            <input
              v-model="rateInput"
              class="radio"
              name="rate"
              type="radio"
              :value="1"
              @change="$emit('change', 1)"
            />
            {{ $t("Original") }}
          </label>
        </li>
        <li>
          <label class="label">
            <input
              v-model="rateInput"
              class="radio"
              name="rate"
              type="radio"
              :value="1.5"
              @change="$emit('change', 1.5)"
            />
            {{ $t("1.5x") }}
          </label>
        </li>
        <li>
          <label class="label">
            <input
              v-model="rateInput"
              class="radio"
              name="rate"
              type="radio"
              :value="2"
              @change="$emit('change', 2)"
            />
            {{ $t("2x") }}
          </label>
        </li>
      </ul>
      <div class="join w-full">
        <button
          class="join-item btn"
          :disabled="rate <= Constants.AUDIOBOOK_MIN_RATE"
          @click="$emit('change', rate - STEP)"
        >
          <MinusIcon class="size-4" />
        </button>
        <input
          class="join-item input w-[4rem] grow"
          :value="rate.toFixed(2)"
          @change="onChange"
        />
        <button
          class="join-item btn"
          :disabled="rate >= Constants.AUDIOBOOK_MAX_RATE"
          @click="$emit('change', rate + STEP)"
        >
          <PlusIcon class="size-4" />
        </button>
      </div>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
import { Constants } from "@/constants";

interface Props {
  rate: number;
}

interface Emits {
  change: [rate: number];
}

const { rate } = defineProps<Props>();
const emit = defineEmits<Emits>();

const rateInput = ref(rate);
const dialog = useTemplateRef("dialog");

function onChange(event: Event) {
  let newRate = Number((event.target as HTMLInputElement).value);
  if (isNaN(newRate)) {
    (event.target as HTMLInputElement).value = rate.toFixed(2);
    return;
  }
  newRate = Math.min(Math.max(newRate, Constants.AUDIOBOOK_MIN_RATE), Constants.AUDIOBOOK_MAX_RATE);
  emit("change", newRate);
}

function toggle() {
  dialog.value!.toggle();
}

defineExpose({ toggle });

watch(
  () => rate,
  () => {
    rateInput.value = rate;
  },
);
</script>
